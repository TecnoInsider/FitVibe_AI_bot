import { NutritionStats } from "../types";

export type Gender = "male" | "female";

interface GoalCalculationInput {
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  activityLevel: string;
  goal: string;
  gender: Gender;
}

interface GoalCalculationResult {
  dailyGoalKcal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

const ACTIVITY_FACTORS: Record<string, number> = {
  "Сидячий": 1.2,
  "Легкая активность": 1.375,
  "Умеренная активность": 1.55,
  "Высокая активность": 1.725,
};

const DEFAULT_ACTIVITY_FACTOR = 1.2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getGoalMultiplier = (
  goal: string,
  currentWeight: number,
  targetWeight: number
): number => {
  if (goal === "Снижение веса") {
    const delta = Math.max(0, currentWeight - targetWeight);
    if (delta >= 15) return 0.78;
    if (delta >= 7) return 0.82;
    return 0.85;
  }

  if (goal === "Набор мышечной массы") {
    const delta = Math.max(0, targetWeight - currentWeight);
    if (delta >= 10) return 1.15;
    return 1.1;
  }

  return 1;
};

export const calculateAutoNutritionGoals = (
  input: GoalCalculationInput
): GoalCalculationResult => {
  const activityFactor =
    ACTIVITY_FACTORS[input.activityLevel] ?? DEFAULT_ACTIVITY_FACTOR;

  const bmrBase =
    10 * input.currentWeight + 6.25 * input.height - 5 * input.age;
  const bmr = input.gender === "male" ? bmrBase + 5 : bmrBase - 161;
  const tdee = bmr * activityFactor;
  const goalMultiplier = getGoalMultiplier(
    input.goal,
    input.currentWeight,
    input.targetWeight
  );

  const minCalories = input.gender === "male" ? 1500 : 1200;
  const targetCalories = clamp(
    Math.round(tdee * goalMultiplier),
    minCalories,
    4500
  );

  const carbsGoal = Math.max(0, Math.round((targetCalories * 0.5) / 4));
  const proteinGoal = Math.max(0, Math.round((targetCalories * 0.25) / 4));
  const fatGoal = Math.max(0, Math.round((targetCalories * 0.25) / 9));

  return {
    dailyGoalKcal: targetCalories,
    proteinGoal,
    carbsGoal,
    fatGoal,
  };
};

export const hasAnyNutritionGoals = (stats?: NutritionStats | null): boolean => {
  if (!stats) return false;
  return [
    stats.dailyGoalKcal,
    stats.proteinGoal,
    stats.carbsGoal,
    stats.fatGoal,
  ].some((value) => Number(value) > 0);
};
