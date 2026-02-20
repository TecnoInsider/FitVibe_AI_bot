# FitVibe: идемпотентность `payments/lava/callback`

## Зачем

Если один и тот же callback из Lava запускается повторно (replay/manual test), текущий workflow снова делает `SQL Activate Paid Access` и повторно продлевает доступ.

## Простой и безопасный подход

Делаем дедупликацию по `dedupe_key` (хэш сырого payload):

- одинаковый callback payload обрабатывается только 1 раз;
- новые реальные оплаты проходят (payload другой -> другой key).

Это проще, чем пытаться dedup только по `contract_id` (можно случайно заблокировать легитимные рекуррентные события).

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

## 2) Обновить node `Normalize Callback` (Code)

Заменить код на этот:

```javascript
const raw = $json.body ?? $json;

function toObj(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

const merchantData = toObj(raw.merchantData) || toObj(raw.metadata) || toObj(raw.meta) || {};

const eventType = String(raw.eventType ?? '').toLowerCase();
const status = String(raw.status ?? raw.paymentStatus ?? raw.event ?? raw.state ?? '').toLowerCase();

const isPaid =
  eventType === 'payment.success' ||
  eventType === 'subscription.recurring.payment.success' ||
  ['paid','success','succeeded','completed','finished','subscription-active'].includes(status);

const internalId = String(merchantData.internal_id ?? raw.internal_id ?? '').trim() || null;
const buyerEmail = String(raw.buyer?.email ?? merchantData.email ?? '').trim().toLowerCase() || null;
const telegramId = Number(merchantData.telegram_id ?? merchantData.tg_id ?? raw.telegram_id ?? raw.tg_id ?? 0) || null;

const planRaw = Number(merchantData.plan_months ?? raw.plan_months ?? 1);
const planMonths = [1,3,6,12].includes(planRaw) ? planRaw : 1;

const invoiceId = String(raw.id ?? raw.invoiceId ?? raw.invoice_id ?? '').trim() || null;
const contractId = String(raw.contractId ?? raw.contract_id ?? '').trim() || null;

// Дедуп-ключ: стабильная строка из полного payload
const dedupeKey = JSON.stringify(raw);

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

## 3) Добавить новый node `SQL Idempotency Guard` (Postgres)

Поставить node сразу после ветки `IF Paid?` = `true`.

```sql
with ins as (
  insert into public.lava_callback_events (
    dedupe_key,
    event_type,
    status,
    invoice_id,
    contract_id,
    telegram_id,
    payload
  )
  values (
    '{{ ($json.dedupe_key || "").replace(/'/g, "''") }}',
    '{{ ($json.event_type || "").replace(/'/g, "''") }}',
    '{{ ($json.status || "").replace(/'/g, "''") }}',
    {{ $json.invoice_id ? "'" + $json.invoice_id.replace(/'/g, "''") + "'" : 'null' }},
    {{ $json.contract_id ? "'" + $json.contract_id.replace(/'/g, "''") + "'" : 'null' }},
    {{ Number($json.telegram_id || 0) > 0 ? Number($json.telegram_id) : 'null' }},
    '{{ JSON.stringify($json.raw_payload || {}).replace(/'/g, "''") }}'::jsonb
  )
  on conflict (dedupe_key) do nothing
  returning 1
)
select exists(select 1 from ins) as should_process;
```

## 4) Добавить `IF Should Process?`

Условие:

- `={{ $json.should_process === true }}`

Ветки:

- `true` -> текущая цепочка `SQL Resolve User` -> `IF User Resolved?` -> ...
- `false` -> новый `Respond Duplicate`.

## 5) Добавить `Respond Duplicate` (Respond to Webhook)

```json
{ "ok": true, "ignored": true, "reason": "duplicate_callback" }
```

## 6) Подключения (коротко)

Было:

- `IF Paid? (true)` -> `SQL Resolve User`

Станет:

- `IF Paid? (true)` -> `SQL Idempotency Guard` -> `IF Should Process?`
- `IF Should Process? (true)` -> `SQL Resolve User`
- `IF Should Process? (false)` -> `Respond Duplicate`

## 7) Проверка

1. Отправить 1 и тот же payload дважды в `POST /webhook/payments/lava/callback`.
2. Проверить:
   - 1-й запуск: `paid=true`, `access_until` продлен.
   - 2-й запуск: ответ `duplicate_callback`, `access_until` без изменений.
3. Проверить в БД:

```sql
select dedupe_key, event_type, status, created_at
from public.lava_callback_events
order by id desc
limit 5;
```

## Важное замечание

Не делайте дедуп только по `contract_id` или только по `tg_id` — это может зарубить реальные следующие списания по рекуррентной подписке.
