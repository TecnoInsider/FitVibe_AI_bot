export interface PromoCode {
  code: string;
  title: string;
  desc: string;
  expires_at: string;
}

export interface UserProfile {
  internal_id?: string;
  tg_id: number;
  name: string;
  avatar_url?: string;
  email?: string;
  city?: string;
  timezone?: string | null;
  gender?: 'male' | 'female' | null;
  age: number;
  height: number;
  weight: number;
  activity_level: string;
  goal: string;
  access_status?: 'demo' | 'paid' | 'blocked' | 'free' | string;
  access_until?: string | null;
  demo_ends_at?: string | null;
  auto_renew?: boolean | null;
  next_charge_at?: string | null;
  contract_id?: string | null;
  subscription_contract_id?: string | null;
  onboarding_completed?: boolean;
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
  type: 'article' | 'offer';
  zone: 'top_pinned' | 'feed';
  position: number;
  subtitle?: string | null;
  description: string;
  targetUrl: string;
  ctaText: string;
  badge?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
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
