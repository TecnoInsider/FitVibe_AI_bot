# Tasks: Onboarding + Debug Mode Integration

**Input**: Design documents from `/specs/001-onboarding-integration/`
**Prerequisites**: plan.md, spec.md

## User Story 1 - Новый пользователь проходит онбординг (P1)

- [x] [US1] Добавить гейт в `App.tsx` (профиль → онбординг/основной UI)
- [x] [US1] Встроить `pages/OnboardingPage.tsx`
- [x] [US1] Перенести многошаговую форму `components/FitVibeForm.tsx`
- [x] [US1] Добавить `components/HeroSection.tsx`
- [x] [US1] Подключить `createProfile` в `hooks/api.ts`
- [ ] [US1] Проверить корректность `user_profile_write` на реальном webhook

## User Story 2 - Существующий пользователь видит профиль сразу (P1)

- [x] [US2] Проверка наличия профиля в `App.tsx` через `getProfile`
- [ ] [US2] Устранить/обработать 500 от `get-profile` на стороне n8n

## User Story 3 - Debug‑режим (P2)

- [x] [US3] Добавить `lib/debug.ts` для парсинга параметров
- [x] [US3] Поддержка мок‑пользователя в `lib/telegram.ts`
- [x] [US3] Добавить `components/DebugPanel.tsx`
- [ ] [US3] Уточнить список обязательных диагностических полей

## Полировка и документация

- [x] Обновить `PROJECT_STATUS.md`
- [ ] Дополнить `README.md` (инструкции по debug‑режиму и онбордингу)
