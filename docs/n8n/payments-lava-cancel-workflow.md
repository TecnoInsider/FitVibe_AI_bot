# FitVibe: отмена автопродления (Lava)

## Что должно происходить

1. Пользователь нажимает `Отключить автопродление`.
2. Показывается подтверждение:
   - `Подписка активна до <дата>. Новых списаний после этой даты не будет.`
3. После подтверждения фронт вызывает webhook:
   - `POST /webhook/payments/lava/cancel`
4. n8n:
   - определяет подписку (`contract_id` / `tg_id` / `email`),
   - вызывает Lava API отмены автопродления,
   - пишет событие в таблицу `subscription_events`,
   - обновляет пользователя (`auto_renew=false`),
   - возвращает фронту понятный текст.

## Контракт запроса

```json
{
  "tg_id": 123456,
  "email": "user@example.com",
  "contract_id": "sub_abc123"
}
```

## Контракт успешного ответа

```json
{
  "success": true,
  "status": "cancelled",
  "message": "Автопродление отключено. Доступ сохранится до 2026-03-19 18:00"
}
```

## Контракт ошибки

```json
{
  "success": false,
  "status": "error",
  "message": "Не удалось отключить автопродление"
}
```

## Переменные окружения для n8n

- `LAVA_API_KEY`
- `LAVA_CANCEL_SUBSCRIPTION_URL` (endpoint отмены в Lava, см. вашу текущую версию API)

## Таблицы/поля (минимум)

- `user_profiles`: `tg_id`, `email`, `access_until`, `auto_renew`, `subscription_contract_id`, `subscription_cancelled_at`, `subscription_cancel_source`, `subscription_cancel_reason`
- `subscription_events`: `tg_id`, `contract_id`, `event_type`, `status`, `provider_payload`, `created_at`
