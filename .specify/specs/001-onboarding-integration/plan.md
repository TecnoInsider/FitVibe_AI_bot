# Implementation Plan: Onboarding + Debug Mode Integration

## Goal
Интегрировать многошаговый онбординг в основной FitVibe WebApp и обеспечить debug‑режим для запуска в браузере.

## Архитектурное решение

### Гейт для новых пользователей
- В `App.tsx` добавляется `AppContent`, который:
  - получает `user.id` из `TelegramContext`;
  - вызывает `getProfile`;
  - показывает `OnboardingPage`, если профиля нет;
  - иначе рендерит основной роутинг.

### Онбординг
- UI интегрируется напрямую в основной проект:
  - `pages/OnboardingPage.tsx`
  - `components/FitVibeForm.tsx`
  - `components/HeroSection.tsx`
- Многошаговая логика на `react-hook-form` + `zod`.

### Debug‑режим
- `lib/debug.ts` парсит `?debug=1` и `telegram_id`.
- `lib/telegram.ts` при debug подставляет мок‑пользователя.
- `components/DebugPanel.tsx` показывает служебные данные.

## Обновления API
- Добавить webhook `WEBHOOKS.PROFILE.WRITE` для `user_profile_write`.
- Добавить `createProfile` в `hooks/api.ts`.

## Зависимости
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `@radix-ui/react-*` для UI элементов
- `class-variance-authority`, `clsx`, `tailwind-merge`

## UI/Styles
- Добавить `onboarding.css` для анимаций и фирменных акцентов.
- Использовать текущую палитру FitVibe (sky/slate).

## Риски и ограничения
- `getProfile` может возвращать 500 (n8n workflow) — не блокирует UI, но нуждается в бэкенд‑проверке.
- Tailwind CDN остаётся в `index.html` (предупреждение в dev).

## Проверка
- Локальный запуск: `npm run dev`.
- Debug: `http://localhost:5173/?debug=1&telegram_id=...`.
- Проверить сохранение формы и переход на профиль.

## Артефакты
- `App.tsx`
- `pages/OnboardingPage.tsx`
- `components/FitVibeForm.tsx`
- `components/HeroSection.tsx`
- `components/DebugPanel.tsx`
- `lib/debug.ts`, `lib/telegram.ts`
- `hooks/api.ts`, `lib/webhooks.ts`
- `onboarding.css`
