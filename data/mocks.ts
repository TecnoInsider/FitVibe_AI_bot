import { UserProfile, NutritionStats, WorkoutsData, CatalogItem, DailyNutrition } from '../types';

export const profile: UserProfile = {
  tg_id: 123456789,
  name: "Анна",
  age: 35,
  // Fix: The property 'height_cm' does not exist on type 'UserProfile'. It has been corrected to 'height'.
  height: 172,
  // Fix: The property 'weight_kg' does not exist on type 'UserProfile'. It has been corrected to 'weight'.
  weight: 63,
  activity_level: "Средняя",
  goal: "Поддержание веса",
  promo_codes: [
    {code: "FIT-10", title: "Скидка 10%", desc: "на каталог", expires_at: "2025-12-31"},
    {code: "NEWBODY24", title: "-500р на первый заказ", desc: "от 3000р", expires_at: "2024-12-31"},
    {code: "SUMMERFIT", title: "Бесплатная доставка", desc: "на все заказы", expires_at: "2024-08-31"}
  ]
};

export const nutrition: NutritionStats = {
  consumedKcal: 1150,
  dailyGoalKcal: 1800,
  consumedProtein: 57,
  proteinGoal: 110,
  consumedCarbs: 140,
  carbsGoal: 200,
  consumedFat: 38,
  fatGoal: 60,
};

// Fix: The property 'today' does not exist on type 'WorkoutsData'. It has been replaced with 'todayStats' and 'recentWorkouts' to match the type definition.
export const workouts: WorkoutsData = {
  weeklyTarget: 5,
  doneThisWeek: 1,
  todayStats: {
    totalMinutes: 0,
    totalKcal: 0,
  },
  recentWorkouts: []
};

export const catalog: CatalogItem[] = [
  {
    id: "on-gsw-908",
    title: "Протеин Optimum Nutrition",
    img: "https://picsum.photos/seed/whey/400/400",
    category: "Добавки",
    description: "Вкусный и эффективный протеин с повышенным содержанием белка для набора мышечной массы и восстановления.",
    ozon: {price: 2900, url: "https://ozon.ru"},
    wb: {price: 3190, url: "https://wildberries.ru"},
    tags: ["протеин", "whey"]
  },
  {
    id: "creatine-monohydrate-500",
    title: "Креатин моногидрат",
    img: "https://picsum.photos/seed/creatine/400/400",
    category: "Добавки",
    description: "Чистый креатин моногидрат для увеличения силы, выносливости и мышечного объема.",
    ozon: {price: 950, url: "https://ozon.ru"},
    wb: {price: 990, url: "https://wildberries.ru"},
    tags: ["креатин", "сила"]
  },
  {
    id: "nike-dri-fit-tshirt",
    title: "Футболка Nike Dri-FIT",
    img: "https://picsum.photos/seed/tshirt/400/400",
    category: "Одежда",
    description: "Легкая и дышащая футболка для тренировок, отводящая влагу от тела.",
    ozon: {price: 2499, url: "https://ozon.ru"},
    wb: {price: 2599, url: "https://wildberries.ru"},
    tags: ["одежда", "футболка"]
  },
  {
    id: "smart-shaker-750ml",
    title: "Шейкер SmartShake",
    img: "https://picsum.photos/seed/shaker/400/400",
    category: "Аксессуары",
    description: "Удобный трехкомпонентный шейкер для смешивания коктейлей и хранения добавок.",
    ozon: {price: 750, url: "https://ozon.ru"},
    wb: {price: 790, url: "https://wildberries.ru"},
    tags: ["шейкер", "аксессуары"]
  }
];

// Generate historical nutrition data
const generateHistory = (days: number): DailyNutrition[] => {
    const history: DailyNutrition[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        history.push({
            date: date.toISOString().split('T')[0],
            kcal: Math.floor(Math.random() * (2200 - 1500 + 1)) + 1500,
            protein: Math.floor(Math.random() * (120 - 70 + 1)) + 70,
            carbs: Math.floor(Math.random() * (250 - 150 + 1)) + 150,
            fat: Math.floor(Math.random() * (80 - 40 + 1)) + 40,
        });
    }
    return history.reverse(); // from oldest to newest
};

export const nutritionHistory: DailyNutrition[] = generateHistory(90);