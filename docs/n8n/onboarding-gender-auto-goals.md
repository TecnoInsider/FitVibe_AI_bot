# FitVibe: Onboarding (пол) + авторасчёт целей питания

## Что уже реализовано на фронтенде

1. В onboarding добавлено обязательное поле `Пол` (`male` / `female`) на шаге 2.
2. В payload onboarding отправляется `user_gender`.
3. После успешного onboarding фронтенд автоматически считает стартовые цели питания и отправляет их в webhook `update-nutrition-goals`.
4. Звёздочка `*` у обязательных полей теперь:
   - красная, пока поле пустое;
   - нейтральная после заполнения.
5. Ошибки под `Цель` и `Уровень активности` очищаются сразу после выбора значения.

## Формулы авторасчёта (текущая версия)

Источник в коде: `lib/nutrition-goals.ts`.

### 1) BMR (Mifflin-St Jeor)

- `bmrBase = 10 * вес + 6.25 * рост - 5 * возраст`
- для мужчин: `BMR = bmrBase + 5`
- для женщин: `BMR = bmrBase - 161`

### 2) Коэффициент активности

- `Сидячий` = `1.2`
- `Легкая активность` = `1.375`
- `Умеренная активность` = `1.55`
- `Высокая активность` = `1.725`

`TDEE = BMR * activityFactor`

### 3) Коррекция под цель

- `Снижение веса`:
  - если `currentWeight - targetWeight >= 15` -> `* 0.78`
  - если `>= 7` -> `* 0.82`
  - иначе -> `* 0.85`
- `Поддержание веса` -> `* 1.0`
- `Набор мышечной массы`:
  - если `targetWeight - currentWeight >= 10` -> `* 1.15`
  - иначе -> `* 1.1`

### 4) Ограничения калорий

- минимум: `1500` (male), `1200` (female)
- максимум: `4500`
- финал: `targetCalories = clamp(round(TDEE * multiplier), min, 4500)`

### 5) Макросы (FatSecret-style стартовый пресет)

- углеводы: `50%`
- белки: `25%`
- жиры: `25%`

Перевод в граммы:

- `carbsGoal = round((kcal * 0.5) / 4)`
- `proteinGoal = round((kcal * 0.25) / 4)`
- `fatGoal = round((kcal * 0.25) / 9)`

## Какие workflow нужно поменять в n8n

Важно: ориентируйся по `Webhook path`, потому что имя workflow в n8n может быть любым.

### 1) Onboarding write workflow

- Обычно это workflow с webhook:
  - `POST /webhook/user_profile_write`
  - URL из фронта: `WEBHOOKS.PROFILE.WRITE`
- Что поменять:
  1. Принять `user_gender` из входного JSON.
  2. Сохранить в `public.user_profiles.gender` при insert/update профиля.

### 2) Get profile workflow

- Обычно это workflow `get_profile` / `workflow.get_profile` с webhook:
  - `POST /webhook/get-profile`
  - URL из фронта: `WEBHOOKS.PROFILE.GET`
- Что поменять:
  1. В SQL `SELECT` добавить поле `gender`.
  2. В output JSON вернуть `gender`.

### 3) Update nutrition goals workflow

- Workflow с webhook:
  - `POST /webhook/update-nutrition-goals`
  - URL из фронта: `WEBHOOKS.NUTRITION.UPDATE_GOALS`
- Проверить, что принимает и записывает поля:
  - `tg_id`
  - `dailyGoalKcal`
  - `proteinGoal`
  - `carbsGoal`
  - `fatGoal`

## Минимальный чек после правок в n8n

1. Пройти onboarding новым пользователем.
2. Убедиться, что в `user_profiles.gender` записался `male` или `female`.
3. Вызвать `get-profile` и проверить, что `gender` приходит в ответе.
4. Проверить в БД, что после onboarding появились цели:
   - `daily_kcal_goal`, `protein_goal`, `carbs_goal`, `fat_goal`.
5. В разделе `Питание` убедиться, что нет тупика «Установить цели», а карточки целей заполнены.
