# FitVibe: идемпотентность `payments/lava/callback`

## Зачем

Если один и тот же callback из Lava запускается повторно (replay/manual test), текущий workflow снова делает `SQL Activate Paid Access` и повторно продлевает доступ.

## Что внедрено по факту

Дедупликация по `dedupe_key` + запись в `public.lava_callback_events`:

- первый раз событие проходит в обработку;
- повтор того же payload уходит в `duplicate_callback`;
- `access_until` повторно не продлевается.

## 1) SQL (выполнить один раз)

```sql
create table if not exists public.lava_callback_events (
  id bigserial primary key,
  dedupe_key text not null unique,
  event_type text,
  status text,
  invoice_id text,
  contract_id text,
  telegram_id bigint,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lava_callback_events_created_at
  on public.lava_callback_events(created_at desc);
```

## 2) Node `Normalize Callback` (Code)

Используется детерминированная сериализация + FNV-1a (двойной, 16 hex):

```javascript
const raw = $json.body ?? $json;

function toObj(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

// Детерминированная сериализация: одинаковый payload -> одинаковая строка
function stableStringify(value) {
  if (value === null) return 'null';
  const t = typeof value;

  if (t === 'number' || t === 'boolean') return JSON.stringify(value);
  if (t === 'string') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (t === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }

  return JSON.stringify(String(value));
}

// FNV-1a 32-bit -> 8 hex
function fnv1aHash32(str, seed = 0x811c9dc5) {
  let hash = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return ('0000000' + hash.toString(16)).slice(-8);
}

const merchantData =
  toObj(raw.merchantData) ||
  toObj(raw.metadata) ||
  toObj(raw.meta) ||
  {};

const eventType = String(raw.eventType ?? '').toLowerCase();
const status = String(raw.status ?? raw.paymentStatus ?? raw.event ?? raw.state ?? '').toLowerCase();

const isPaid =
  eventType === 'payment.success' ||
  eventType === 'subscription.recurring.payment.success' ||
  ['paid', 'success', 'succeeded', 'completed', 'finished', 'subscription-active'].includes(status);

const internalId = String(merchantData.internal_id ?? raw.internal_id ?? '').trim() || null;
const buyerEmail = String(raw.buyer?.email ?? merchantData.email ?? '').trim().toLowerCase() || null;
const telegramId = Number(merchantData.telegram_id ?? merchantData.tg_id ?? raw.telegram_id ?? raw.tg_id ?? 0) || null;

const planRaw = Number(merchantData.plan_months ?? raw.plan_months ?? 1);
const planMonths = [1, 3, 6, 12].includes(planRaw) ? planRaw : 1;

const invoiceId = String(raw.id ?? raw.invoiceId ?? raw.invoice_id ?? '').trim() || null;
const contractId = String(raw.contractId ?? raw.contract_id ?? '').trim() || null;

// 16-hex dedupe key (два FNV-1a с разными seed/salt)
const payloadStable = stableStringify(raw);
const base = `${eventType}::${status}::${payloadStable}`;
const h1 = fnv1aHash32(base, 0x811c9dc5);
const h2 = fnv1aHash32(`salt::${base}`, 0x9e3779b1);
const dedupeKey = `${h1}${h2}`;

return [{
  json: {
    is_paid: isPaid,
    event_type: eventType,
    status,
    internal_id: internalId,
    buyer_email: buyerEmail,
    telegram_id: telegramId,
    plan_months: planMonths,
    invoice_id: invoiceId,
    contract_id: contractId,
    dedupe_key: dedupeKey,
    raw_payload: raw
  }
}];
```

## 3) Node `SQL Idempotency Guard` (Postgres)

Ставит событие в таблицу и возвращает `should_process` + `src.*` для следующих нод:

```sql
with src as (
  select
    nullif(nullif(lower(trim('{{$json.internal_id}}')), 'null'), '') as internal_id,
    nullif(nullif(lower(trim('{{$json.buyer_email}}')), 'null'), '') as buyer_email,
    case when nullif(nullif(lower(trim('{{$json.telegram_id}}')), 'null'), '') is not null
      then nullif(nullif(lower(trim('{{$json.telegram_id}}')), 'null'), '')::bigint
    end as telegram_id,
    coalesce(nullif('{{$json.plan_months}}','')::int, 1) as plan_months,
    nullif(nullif(lower(trim('{{$json.invoice_id}}')), 'null'), '') as invoice_id,
    nullif(nullif(lower(trim('{{$json.contract_id}}')), 'null'), '') as contract_id,
    '{{ ($json.event_type || "").replace(/'/g, "''") }}' as event_type,
    '{{ ($json.status || "").replace(/'/g, "''") }}' as status,
    '{{ ($json.dedupe_key || "").replace(/'/g, "''") }}' as dedupe_key,
    '{{ JSON.stringify($json.raw_payload || {}).replace(/'/g, "''") }}'::jsonb as raw_payload
),
ins as (
  insert into public.lava_callback_events (
    dedupe_key, event_type, status, invoice_id, contract_id, telegram_id, payload
  )
  select
    dedupe_key, event_type, status, invoice_id, contract_id, telegram_id, raw_payload
  from src
  on conflict (dedupe_key) do nothing
  returning 1
)
select
  exists(select 1 from ins) as should_process,
  src.*
from src;
```

## 4) Node `IF Should Process`

Условие:

- `={{ $json.should_process === true }}`

Ветки:

- `true` -> `SQL Resolve User` -> стандартная цепочка активации.
- `false` -> `Respond Duplicate`.

## 5) Node `Respond Duplicate` (Respond to Webhook)

```json
{ "ok": true, "ignored": true, "reason": "duplicate_callback" }
```

## 6) Подключения

- `IF Paid? (true)` -> `SQL Idempotency Guard` -> `IF Should Process`
- `IF Should Process (true)` -> `SQL Resolve User`
- `IF Should Process (false)` -> `Respond Duplicate`
- `IF Paid? (false)` -> `Respond Ignored`

## 7) Проверка

1. Отправить один и тот же payload дважды в `POST /webhook/payments/lava/callback`.
2. Проверить:
   - 1-й запуск: `should_process=true`, доступ продлен.
   - 2-й запуск: `should_process=false`, ответ `duplicate_callback`, доступа не продляется.
3. Проверить события:

```sql
select id, dedupe_key, event_type, status, invoice_id, contract_id, created_at
from public.lava_callback_events
order by id desc
limit 10;
```

## Важное замечание

Не делайте дедуп только по `contract_id` или только по `tg_id` — это может блокировать реальные следующие списания по рекуррентной подписке.
