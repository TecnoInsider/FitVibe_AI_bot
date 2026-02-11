# Session Report — 2026-02-10

## Что сделали сегодня

- Подготовили рабочую ветку `codex/Vadim` и зафиксировали текущее состояние проекта.
- Исправили гейт новых пользователей: неполный профиль больше не считается завершенным.
- Исправили онбординг submit/redirect: после `Активировать` фронт подтверждает профиль через `getProfile` и только затем переводит в основной профиль.
- Убрали автоподстановку тестовых персональных данных в debug-режиме.
- Удалили legacy-папку `fitvibe-profile-builder-main` из проекта.
- В онбординге:
  - добавили обязательное поле `Город`;
  - убрали поле `Телефон` из UI и payload;
  - добавили подпись под `Город` про использование для часового пояса и напоминаний.
- Подключили два webhook для часового пояса:
  - основной: `get-timezone-city`;
  - fallback: `get-timezone` (IP-вариант).
- На фронте реализовали резолв timezone по городу перед `user_profile_write` с fallback на старый webhook.

## Что изменили в коде

- `components/FitVibeForm.tsx`
  - логика онбординга/сабмита;
  - валидация шага 1;
  - поле `city`, удаление `phone`;
  - резолв timezone через webhook перед записью профиля.
- `hooks/api.ts`
  - добавлены методы/типы для определения timezone;
  - поддержка primary/fallback webhook;
  - обновлен payload онбординга (`user_city`, `user_timezone`).
- `lib/webhooks.ts`
  - добавлен раздел `TIMEZONE` с двумя webhook URL.

## База данных (согласовано и выполнено со стороны Supabase)

- Добавлен `internal_id`, удален legacy `salebot_user_id`.
- Добавлены поля часового пояса:
  - `timezone`
  - `timezone_source`
  - `timezone_updated_at`
- Добавлены поля напоминаний:
  - `reminder_time_local`
  - `reminders_enabled`
  - `last_reminder_local_date`

## Проверки

- `npm run build` проходит на текущем состоянии.
- `get-timezone-city?city=Moscow` возвращает корректный timezone (`Europe/Moscow`).
- Старый `get-timezone` оставлен как fallback.

## Зафиксированные задачи в Linear (на завтра)

- `TEC-148` — Onboarding: city + timezone derivation (due: 2026-02-11).
- `TEC-152` — Reminder scheduling by user timezone (due: 2026-02-11).

## Следующий шаг

- Проверить в n8n, что `user_profile_write` стабильно пишет `city/timezone/timezone_source/timezone_updated_at` в `user_profiles`.
- Реализовать и протестировать workflow напоминаний (Cron + SQL due users + mark sent date).
