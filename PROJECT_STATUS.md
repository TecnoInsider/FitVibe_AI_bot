# FitVibe — статус и документация

## Обзор
Проект — Telegram WebApp (Vite + React) для фитнеса и питания. Сейчас в приложение встроен полноценный онбординг (многошаговая форма) из `fitvibe-profile-builder-main`, который показывается только новым пользователям. После сохранения данных происходит переход в профиль.

## Текущая архитектура
- Основное приложение: корень репозитория (Vite + React).
- Онбординг: теперь интегрирован в основной проект (страница `OnboardingPage`).
- Данные профиля: читаются через `getProfile` из n8n webhook.
- Telegram WebApp инициализация: `lib/telegram.ts`.

## Онбординг (новые пользователи)
Логика:
- При запуске: запрашивается профиль (`getProfile`).
- Если профиля нет/пусто → показывается онбординг.
- После успешного сохранения профиля → редирект в основной UI (профиль).

Основные файлы:
- `App.tsx` — гейт на онбординг.
- `pages/OnboardingPage.tsx` — контейнер онбординга.
- `components/FitVibeForm.tsx` — многошаговая форма и сабмит.

## Debug-режим (браузер)
Назначение: запуск WebApp в браузере без Telegram SDK, с диагностикой.

Включение:
- `?debug=1&telegram_id=377484655`
- Допустимы параметры `telegram_id`, `tg_id`, `chat_id`.

Что делает:
- В `lib/telegram.ts` подставляет мок‑пользователя на основе `telegram_id`.
- Включает диагностическую панель `DebugPanel`.

Файлы:
- `lib/debug.ts` — парсинг debug‑параметров.
- `components/DebugPanel.tsx` — UI панели.

## Вебхуки и API
Файл: `lib/webhooks.ts`.

Ключевые endpoints:
- `WEBHOOKS.PROFILE.GET` → получение профиля.
- `WEBHOOKS.PROFILE.WRITE` → запись данных онбординга (user_profile_write).
- `WEBHOOKS.PROFILE.UPDATE` → обновление профиля.

Сабмит формы:
- `hooks/api.ts` → `createProfile(payload)`.

## Spec Kit
Spec Kit установлен и инициализирован для этого репозитория.

Инструменты:
- `specify` доступен глобально.
- В репозитории добавлены `.specify/` и `.codex/`.

Важно:
- `.codex/` добавлен в `.gitignore` (не хранить приватные артефакты).

## Команды
- `npm install`
- `npm run dev`
- `npm run build`

## Запуск и проверка
- Запуск: `npm run dev`
- Debug режим (браузер): `http://localhost:5173/?debug=1&telegram_id=377484655`
- Проверка онбординга: новый `telegram_id` → форма
- Проверка профиля: существующий `telegram_id` → профиль без формы

## Локальные ссылки
- `http://localhost:5173/`
- Debug: `http://localhost:5173/?debug=1&telegram_id=377484655`

## Текущее состояние и наблюдения
- UI онбординга загружается корректно.
- В браузере при debug‑режиме мок‑пользователь создается и интерфейс доступен.
- Ошибка 500 от `get-profile` (n8n workflow) — нужно проверить бэкенд.

## Что сделано
- Интегрирован многошаговый онбординг.
- Реализован гейт на новых пользователей.
- Добавлен debug‑режим и панель диагностики.
- Подключен Spec Kit (`specify init --here`).

## Ближайшие задачи (черновик)
- Проверить `get-profile` (ошибка 500 на стороне n8n).
- Подтвердить корректность webhook для онбординга (user_profile_write).
- Сверить ветку `aleksandr-branch` — возможно, есть полезные изменения.
- Уточнить требования к debug‑панели (какие поля показывать).
- Подготовить Spec Kit артефакты (constitution/spec/plan/tasks).

## Полезные файлы
- `App.tsx`
- `pages/OnboardingPage.tsx`
- `components/FitVibeForm.tsx`
- `lib/telegram.ts`
- `lib/debug.ts`
- `hooks/api.ts`
- `lib/webhooks.ts`
