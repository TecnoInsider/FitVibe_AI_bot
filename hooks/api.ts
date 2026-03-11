
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
        const now = Date.now();
        const toString = (v: unknown): string => String(v ?? '').trim();
        const parseDate = (v: unknown): number | null => {
            const s = toString(v);
            if (!s) return null;
            const ts = Date.parse(s);
            return Number.isFinite(ts) ? ts : null;
        };
        const parseBool = (v: unknown): boolean => {
            if (typeof v === 'boolean') return v;
            const s = toString(v).toLowerCase();
            return ['true', '1', 'yes', 'y', 'да'].includes(s);
        };
        const parseTags = (v: unknown): string[] => {
            if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
            const s = toString(v);
            if (!s) return [];
            return s.split('|').map((x) => x.trim()).filter(Boolean);
        };

        const normalized: CatalogItem[] = data
            .map((raw: any): CatalogItem | null => {
                // New promo_items format
                if (raw && (raw.item_key || raw.target_url || raw.zone || raw.type)) {
                    const startsAt = toString(raw.starts_at) || null;
                    const endsAt = toString(raw.ends_at) || null;
                    const startsTs = parseDate(startsAt);
                    const endsTs = parseDate(endsAt);
                    const isActive = raw.is_active === undefined ? true : parseBool(raw.is_active);
                    if (!isActive) return null;
                    if (startsTs !== null && startsTs > now) return null;
                    if (endsTs !== null && endsTs < now) return null;

                    const type = toString(raw.type) === 'article' ? 'article' : 'offer';
                    const zone = toString(raw.zone) === 'top_pinned' ? 'top_pinned' : 'feed';
                    const tags = parseTags(raw.tags);
                    const category = tags[0] || (type === 'article' ? 'Статьи' : 'Офферы');

                    return {
                        id: toString(raw.item_key),
                        title: toString(raw.title) || 'Без названия',
                        subtitle: toString(raw.subtitle) || null,
                        img: toString(raw.image_url),
                        category,
                        type,
                        zone,
                        position: Number(raw.position ?? 0) || 0,
                        description: toString(raw.description),
                        targetUrl: toString(raw.target_url),
                        ctaText: toString(raw.cta_text) || (type === 'article' ? 'Читать' : 'Подробнее'),
                        badge: toString(raw.badge) || null,
                        isActive: true,
                        startsAt,
                        endsAt,
                        tags,
                    };
                }

                // Legacy format fallback
                if (raw && (raw.id || raw.title || raw.img)) {
                    const targetUrl = raw?.ozon?.url || raw?.wb?.url || '';
                    return {
                        id: toString(raw.id),
                        title: toString(raw.title) || 'Без названия',
                        subtitle: null,
                        img: toString(raw.img),
                        category: toString(raw.category) || 'Без категории',
                        type: 'offer',
                        zone: 'feed',
                        position: 0,
                        description: toString(raw.description),
                        targetUrl,
                        ctaText: 'Подробнее',
                        badge: null,
                        isActive: true,
                        startsAt: null,
                        endsAt: null,
                        ozon: raw.ozon,
                        wb: raw.wb,
                        tags: Array.isArray(raw.tags) ? raw.tags : [],
                    };
                }

                return null;
            })
            .filter((x: CatalogItem | null): x is CatalogItem => Boolean(x))
            .sort((a, b) => {
                if (a.zone !== b.zone) return a.zone === 'top_pinned' ? -1 : 1;
                return a.position - b.position;
            });

        return normalized;
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
    user_city: string;
    user_timezone: string;
    user_weight: number;
    user_weight_wanted: number;
    user_height: number;
    user_age: number;
    user_gender: 'male' | 'female';
    user_activity: string;
    user_goal: string;
}

interface TimezoneLookupResult {
    city?: string;
    country?: string;
    timezone: string;
    utc_offset?: string;
    formatted_utc?: string;
}

const parseTimezoneFromJson = (raw: any): TimezoneLookupResult | null => {
    if (!raw) return null;
    const candidate = Array.isArray(raw) ? raw[0] : raw;
    if (!candidate || typeof candidate !== 'object') return null;

    const timezone =
        candidate.timezone ||
        candidate.time_zone ||
        candidate.tz ||
        null;

    if (!timezone || typeof timezone !== 'string') return null;

    return {
        city: typeof candidate.city === 'string' ? candidate.city : undefined,
        country: typeof candidate.country === 'string' ? candidate.country : undefined,
        timezone,
        utc_offset: typeof candidate.utc_offset === 'string' ? candidate.utc_offset : undefined,
        formatted_utc: typeof candidate.formatted_utc === 'string' ? candidate.formatted_utc : undefined,
    };
};

const extractHtmlField = (html: string, label: string): string | undefined => {
    const pattern = new RegExp(`<b>${label}:<\\/b>\\s*([^<]+)`, 'i');
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    return value || undefined;
};

const parseTimezoneFromHtml = (html: string): TimezoneLookupResult | null => {
    const timezone = extractHtmlField(html, 'Часовой пояс');
    if (!timezone) return null;

    return {
        city: extractHtmlField(html, 'Город'),
        country: extractHtmlField(html, 'Страна'),
        timezone,
        formatted_utc: extractHtmlField(html, 'Смещение'),
    };
};

const requestTimezoneEndpoint = async (url: string): Promise<TimezoneLookupResult | null> => {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        if (!text) return null;

        if (contentType.includes('application/json')) {
            try {
                return parseTimezoneFromJson(JSON.parse(text));
            } catch {
                return null;
            }
        }

        // Some n8n flows respond as HTML. Parse the key fields if present.
        return parseTimezoneFromHtml(text);
    } catch (error) {
        console.warn('Timezone endpoint request failed:', url, error);
        return null;
    }
};

export const resolveTimezoneForCity = async (city: string): Promise<TimezoneLookupResult | null> => {
    const normalizedCity = city.trim();
    if (!normalizedCity) return null;

    const cityUrl = `${WEBHOOKS.TIMEZONE.CITY}?city=${encodeURIComponent(normalizedCity)}`;
    const cityResult = await requestTimezoneEndpoint(cityUrl);
    if (cityResult?.timezone) return cityResult;

    // Fallback: legacy IP-based webhook if city workflow is unavailable.
    const ipResult = await requestTimezoneEndpoint(WEBHOOKS.TIMEZONE.IP);
    if (ipResult?.timezone) return ipResult;

    return null;
};

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

export type PaymentMethod = 'ru' | 'foreign';
export type PaymentCurrency = 'RUB' | 'USD' | 'EUR';

export interface PaymentPricingItem {
    method: PaymentMethod;
    currency: PaymentCurrency;
    period_months: 1 | 3 | 6 | 12;
    amount: number;
}

interface CreatePaymentPayload {
    telegram_id: number;
    internal_id?: string;
    email?: string;
    plan_months: 1 | 3 | 6 | 12;
    currency: PaymentCurrency;
    ui_method: 'bank_ru' | 'bank_foreign';
    return_url?: string;
}

interface CancelSubscriptionPayload {
    tg_id: number;
    email?: string;
    contract_id?: string;
}

const normalizeMethod = (value: unknown): PaymentMethod | null => {
    const raw = String(value ?? '').toLowerCase().trim();
    if (['ru', 'rf', 'bank_rf', 'russian_bank', 'local'].includes(raw)) return 'ru';
    if (['foreign', 'int', 'international', 'foreign_bank'].includes(raw)) return 'foreign';
    return null;
};

const normalizeCurrency = (value: unknown): PaymentCurrency | null => {
    const raw = String(value ?? '').toUpperCase().trim();
    if (raw === 'RUB' || raw === 'USD' || raw === 'EUR') return raw;
    return null;
};

const normalizePeriod = (value: unknown): 1 | 3 | 6 | 12 | null => {
    const num = Number(value);
    if (num === 1 || num === 3 || num === 6 || num === 12) return num;
    return null;
};

const normalizePricingArray = (items: any[]): PaymentPricingItem[] => {
    return items
        .map((item) => {
            const method = normalizeMethod(item.method ?? item.payment_method ?? item.bank_type);
            const currency = normalizeCurrency(item.currency);
            const period = normalizePeriod(item.period_months ?? item.months ?? item.period ?? item.plan_months);
            const amount = Number(item.amount ?? item.price ?? item.total ?? 0);
            if (!method || !currency || !period || !Number.isFinite(amount) || amount <= 0) return null;
            return { method, currency, period_months: period, amount };
        })
        .filter((item): item is PaymentPricingItem => item !== null);
};

const parsePricingResponse = (raw: any): PaymentPricingItem[] => {
    if (!raw) return [];

    if (Array.isArray(raw)) {
        return normalizePricingArray(raw);
    }

    if (Array.isArray(raw.items)) {
        return normalizePricingArray(raw.items);
    }

    if (Array.isArray(raw.options)) {
        return normalizePricingArray(raw.options);
    }

    if (raw.prices && typeof raw.prices === 'object') {
        const rows: any[] = [];
        Object.entries(raw.prices).forEach(([methodKey, currencyMap]) => {
            if (!currencyMap || typeof currencyMap !== 'object') return;
            Object.entries(currencyMap as Record<string, unknown>).forEach(([currencyKey, periodMap]) => {
                if (!periodMap || typeof periodMap !== 'object') return;
                Object.entries(periodMap as Record<string, unknown>).forEach(([periodKey, amount]) => {
                    rows.push({
                        method: methodKey,
                        currency: currencyKey,
                        period_months: Number(periodKey),
                        amount,
                    });
                });
            });
        });
        return normalizePricingArray(rows);
    }

    return [];
};

export const getLavaPricing = async (tg_id: number, email?: string): Promise<PaymentPricingItem[]> => {
    const raw = await apiRequest<any>(WEBHOOKS.PAYMENTS.PRICING, {
        method: 'POST',
        body: JSON.stringify({ tg_id, email }),
    });
    return parsePricingResponse(raw);
};

export const createLavaPayment = async (payload: CreatePaymentPayload): Promise<string | null> => {
    // Единый контракт с текущим n8n webhook payments/lava/create.
    const requestPayload = {
        telegram_id: payload.telegram_id,
        internal_id: payload.internal_id,
        email: payload.email,
        plan_months: payload.plan_months,
        currency: payload.currency,
        ui_method: payload.ui_method,
    };

    const raw = await apiRequest<any>(WEBHOOKS.PAYMENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify(requestPayload),
    });

    if (!raw) return null;
    if (typeof raw.payment_url === 'string' && raw.payment_url) return raw.payment_url;
    if (typeof raw.checkout_url === 'string' && raw.checkout_url) return raw.checkout_url;
    if (typeof raw.url === 'string' && raw.url) return raw.url;
    return null;
};

export const cancelLavaSubscription = async (payload: CancelSubscriptionPayload): Promise<boolean> => {
    const raw = await apiRequest<any>(WEBHOOKS.PAYMENTS.CANCEL, {
        method: 'POST',
        body: JSON.stringify({
            tg_id: payload.tg_id,
            email: payload.email,
            contract_id: payload.contract_id,
        }),
    });

    if (!raw) return false;
    if (typeof raw.success === 'boolean') return raw.success;

    const status =
        (typeof raw.status === 'string' && raw.status) ||
        (typeof raw.subscription_status === 'string' && raw.subscription_status) ||
        (typeof raw.result === 'string' && raw.result) ||
        (typeof raw.message === 'string' && raw.message) ||
        '';

    const normalized = status.toLowerCase();
    if (['ok', 'success', 'cancelled', 'canceled', 'inactive'].includes(normalized)) return true;

    return false;
};
