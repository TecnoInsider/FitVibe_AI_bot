
import { WEBHOOKS } from '../lib/webhooks';
import { UserProfile, NutritionStats, DailyNutrition, WorkoutsData, CatalogItem, Workout, NutritionLog, NutritionPageData } from '../types';

// Вспомогательная функция для выполнения API-запросов
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T | null> {
    try {
        const response = await fetch(url, {
            method: 'GET', // метод по умолчанию
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
            return null;
        }
        
        const data = JSON.parse(text);

        // NEW: Обработка случая, когда n8n возвращает { "json": [...] }
        if (data && typeof data === 'object' && !Array.isArray(data) && data.hasOwnProperty('json')) {
            const unwrappedData = data.json;
            if (Array.isArray(unwrappedData) && unwrappedData.length === 0) {
                return null;
            }
            return unwrappedData as T;
        }

        // n8n может вернуть пустой массив, если ничего не найдено
        if (Array.isArray(data) && data.length === 0) {
            return null;
        }
        
        // n8n может вернуть массив с одним объектом, содержащим "json"
        if (Array.isArray(data) && data.length > 0 && data[0].json) {
            // Если json - это массив, возвращаем его
            if (Array.isArray(data[0].json)) {
                return data[0].json as T;
            }
            return data[0].json as T;
        }

        // Обработка случая, когда n8n возвращает массив с одним объектом напрямую
        if (Array.isArray(data) && data.length > 0) {
             // Проверяем, является ли первый элемент 'json', что может быть результатом предыдущего узла n8n
            if (data.length === 1 && typeof data[0].json !== 'undefined') {
                if (Array.isArray(data[0].json)) {
                    return data[0].json.length > 0 ? data[0].json : null;
                }
                return data[0].json;
            }
            return data as T;
        }


        return data as T;

    } catch (error) {
        console.error(`API request failed for URL: ${url}`, error);
        // В случае сетевой ошибки или другой проблемы, возвращаем null, чтобы приложение не падало
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             console.warn('Network error detected. Returning null.');
             return null;
        }
        throw error;
    }
}

// --- GET-запросы ---

export const getProfile = (tg_id: number): Promise<UserProfile | null> => {
    return apiRequest<UserProfile>(WEBHOOKS.PROFILE.GET, {
        method: 'POST',
        body: JSON.stringify({ tg_id }),
    });
};


export const getCatalog = async (): Promise<CatalogItem[] | null> => {
    // Вебхуки n8n в этом проекте стандартизированы на POST, даже для получения данных.
    const data = await apiRequest<any>(WEBHOOKS.CATALOG.GET, {
        method: 'POST',
        body: JSON.stringify({}), // Отправляем пустой объект, так как тело запроса может быть обязательным
    });

    if (data && Array.isArray(data)) {
        return data as CatalogItem[];
    }
    
    console.warn('getCatalog() did not receive an array. Returning null.', data);
    return null;
};


// Интерфейс для "сырых" данных, которые приходят от бэкенда
interface RawNutritionData {
    stats: {
        consumed_kcal?: number;
        consumed_protein?: number;
        consumed_carbs?: number;
        consumed_fat?: number; 
        daily_kcal_goal?: number;
        protein_goal?: number;
        carbs_goal?: number;
        fat_goal?: number;
    };
    logs: NutritionLog[];
}

export const getNutritionPageData = async (tg_id: number): Promise<NutritionPageData | null> => {
    const rawDataArray = await apiRequest<RawNutritionData[] | RawNutritionData>(WEBHOOKS.NUTRITION.GET, {
        method: 'POST',
        body: JSON.stringify({ tg_id }),
    });

    const rawData = Array.isArray(rawDataArray) ? rawDataArray[0] : rawDataArray;

    if (!rawData || !rawData.stats) {
        return null;
    }

    const transformedData: NutritionPageData = {
        stats: {
            consumedKcal: rawData.stats.consumed_kcal || 0,
            dailyGoalKcal: rawData.stats.daily_kcal_goal || 0,
            consumedProtein: rawData.stats.consumed_protein || 0,
            proteinGoal: rawData.stats.protein_goal || 0,
            consumedCarbs: rawData.stats.consumed_carbs || 0,
            carbsGoal: rawData.stats.carbs_goal || 0,
            consumedFat: rawData.stats.consumed_fat || 0,
            fatGoal: rawData.stats.fat_goal || 0,
        },
        logs: rawData.logs || [],
    };

    return transformedData;
};


export const getNutritionHistory = async (tg_id: number): Promise<DailyNutrition[] | null> => {
    const data = await apiRequest<DailyNutrition[] | DailyNutrition>(WEBHOOKS.ANALYTICS.GET, {
        method: 'POST',
        body: JSON.stringify({ tg_id }),
    });

    if (Array.isArray(data)) {
        return data;
    }
    
    // NEW: Handle the case where apiRequest unwraps a single-element array into an object.
    if (data && typeof data === 'object' && !Array.isArray(data) && 'date' in data) {
        return [data as DailyNutrition]; // Wrap the single object in an array
    }

    if (data) {
        console.warn('getNutritionHistory received unexpected data, returning null. Check n8n workflow.', data);
    }
    
    return null;
};

export const getWorkouts = (tg_id: number): Promise<WorkoutsData | null> => {
    return apiRequest<WorkoutsData>(WEBHOOKS.WORKOUTS.GET, {
        method: 'POST',
        body: JSON.stringify({ tg_id }),
    });
};

// --- POST/UPDATE-запросы ---

export const updateProfile = (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    return apiRequest<UserProfile>(WEBHOOKS.PROFILE.UPDATE, {
        method: 'POST',
        body: JSON.stringify(profileData),
    }) as Promise<UserProfile>; // Утверждаем тип, так как ожидаем успешный ответ
};

interface OnboardingPayload {
    chat_id: string;
    telegram_id: string;
    telegram_username: string;
    user_name: string;
    email: string;
    phone: string;
    user_weight: number;
    user_weight_wanted: number;
    user_height: number;
    user_age: number;
    user_activity: string;
    user_goal: string;
}

export const createProfile = (payload: OnboardingPayload): Promise<UserProfile | null> => {
    return apiRequest<UserProfile>(WEBHOOKS.PROFILE.WRITE, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const addWorkout = (workout: Omit<Workout, 'id'>, tg_id: number): Promise<Workout> => {
    // Преобразуем поля для соответствия с базой данных
    const payload = {
        tg_id,
        type: workout.type,
        date: workout.date,
        duration_minutes: workout.minutes,
        calories_burned: workout.kcal,
        notes: workout.notes,
    };
    
    return apiRequest<Workout>(WEBHOOKS.WORKOUTS.ADD, {
        method: 'POST',
        body: JSON.stringify(payload),
    }) as Promise<Workout>;
};

export const updateWorkout = (workout: Workout, tg_id: number): Promise<Workout> => {
    const payload = {
        id: workout.id,
        tg_id,
        type: workout.type,
        date: workout.date,
        duration_minutes: workout.minutes,
        calories_burned: workout.kcal,
        notes: workout.notes,
    };
    return apiRequest<Workout>(WEBHOOKS.WORKOUTS.UPDATE, {
        method: 'POST',
        body: JSON.stringify(payload),
    }) as Promise<Workout>;
};

export const deleteWorkout = (id: string): Promise<any> => {
    if (window.confirm('Вы уверены, что хотите удалить эту тренировку?')) {
        return apiRequest(WEBHOOKS.WORKOUTS.DELETE, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
    }
    return Promise.resolve(null); // Возвращаем null, если пользователь отменил
};

export const updateNutritionGoals = (goals: NutritionStats, tg_id: number): Promise<NutritionStats | null> => {
    // Отправляем только поля с целями, а не все подряд
    const payload = {
      dailyGoalKcal: goals.dailyGoalKcal,
      proteinGoal: goals.proteinGoal,
      carbsGoal: goals.carbsGoal,
      fatGoal: goals.fatGoal,
      tg_id,
    };
    return apiRequest<NutritionStats>(WEBHOOKS.NUTRITION.UPDATE_GOALS, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const addNutritionLog = (log: Omit<NutritionLog, 'id' | 'created_at'>, tg_id: number): Promise<NutritionLog> => {
    const payload = { ...log, tg_id };
    return apiRequest<NutritionLog>(WEBHOOKS.NUTRITION.ADD_LOG, {
        method: 'POST',
        body: JSON.stringify(payload),
    }) as Promise<NutritionLog>;
};

export const updateNutritionLog = (log: NutritionLog, tg_id: number): Promise<NutritionLog> => {
    const payload = { ...log, tg_id };
    return apiRequest<NutritionLog>(WEBHOOKS.NUTRITION.UPDATE_LOG, {
        method: 'POST',
        body: JSON.stringify(payload),
    }) as Promise<NutritionLog>;
};

export const deleteNutritionLog = (id: string): Promise<any> => {
    return apiRequest(WEBHOOKS.NUTRITION.DELETE_LOG, {
        method: 'POST',
        body: JSON.stringify({ id }),
    });
};

export const uploadAvatar = async (file: File, tg_id: number): Promise<{ avatar_url: string } | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tg_id', String(tg_id));

    try {
        const response = await fetch(WEBHOOKS.PROFILE.UPLOAD_AVATAR, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) return null;
        
        const data = JSON.parse(text);

        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (firstItem.link_avatar) {
                return { avatar_url: firstItem.link_avatar };
            }
        }

        if (data && data.link_avatar) {
            return { avatar_url: data.link_avatar };
        }
        
        if (data && data.avatar_url) {
            return { avatar_url: data.avatar_url };
        }

        return null;

    } catch (error) {
        console.error(`API request failed for URL: ${WEBHOOKS.PROFILE.UPLOAD_AVATAR}`, error);
        throw error;
    }
};
