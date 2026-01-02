export interface PromoCode {
  code: string;
  title: string;
  desc: string;
  expires_at: string;
}

export interface UserProfile {
  tg_id: number;
  name: string;
  avatar_url?: string;
  age: number;
  height: number;
  weight: number;
  activity_level: string;
  goal: string;
  promo_codes: PromoCode[];
}

export interface NutritionStats {
  consumedKcal: number;
  dailyGoalKcal: number;
  consumedProtein: number;
  proteinGoal: number;
  consumedCarbs: number;
  carbsGoal: number;
  consumedFat: number;
  fatGoal: number;
}

export interface DailyNutrition {
    date: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutritionLog {
  id: string;
  date: string;
  meal_type: 'Завтрак' | 'Обед' | 'Ужин' | 'Перекус';
  food_description: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string; // ISO string date
}

export interface NutritionPageData {
  stats: NutritionStats;
  logs: NutritionLog[];
}


export interface Workout {
  id: string;
  type: string;
  minutes: number;
  kcal: number;
  date: string;
  notes?: string;
}

export interface WorkoutsData {
  weeklyTarget: number;
  doneThisWeek: number;
  todayStats: {
    totalMinutes: number;
    totalKcal: number;
  };
  recentWorkouts: Workout[];
}

export interface CatalogItem {
  id: string;
  title: string;
  img: string;
  category: string;
  description: string;
  ozon?: {
    price: number;
    url: string;
  };
  wb?: {
    price: number;
    url:string;
  };
  tags: string[];
}