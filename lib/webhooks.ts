// Этот файл содержит все URL-адреса вебхуков для взаимодействия с бэкендом n8n.
export const WEBHOOKS = {
  PROFILE: {
    GET: "https://n8n.techno-insider.com/webhook/get-profile",
    UPDATE: "https://n8n.techno-insider.com/webhook/update-profile",
    WRITE: "https://n8n.techno-insider.com/webhook/user_profile_write",
    UPLOAD_AVATAR: "https://n8n.techno-insider.com/webhook/upload-avatar",
  },
  NUTRITION: {
    GET: "https://n8n.techno-insider.com/webhook/get-nutrition",
    UPDATE_GOALS:
      "https://n8n.techno-insider.com/webhook/update-nutrition-goals",
    GET_LOGS: "https://n8n.techno-insider.com/webhook/get-nutrition-logs",
    ADD_LOG: "https://n8n.techno-insider.com/webhook/add-nutrition-log",
    UPDATE_LOG: "https://n8n.techno-insider.com/webhook/update-nutrition-log",
    DELETE_LOG: "https://n8n.techno-insider.com/webhook/delete-nutrition-log",
  },
  WORKOUTS: {
    GET: "https://n8n.techno-insider.com/webhook/get-workouts",
    ADD: "https://n8n.techno-insider.com/webhook/add-workout",
    UPDATE: "https://n8n.techno-insider.com/webhook/update-workout",
    DELETE: "https://n8n.techno-insider.com/webhook/delete-workout",
  },
  CATALOG: {
    GET: "https://n8n.techno-insider.com/webhook/get-catalog",
  },
  ANALYTICS: {
    GET: "https://n8n.techno-insider.com/webhook/get-nutrition-history",
  },
  TIMEZONE: {
    CITY: "https://n8n.techno-insider.com/webhook/get-timezone-city",
    IP: "https://n8n.techno-insider.com/webhook/get-timezone",
  },
  PAYMENTS: {
    PRICING: "https://n8n.techno-insider.com/webhook/payments/lava/prices",
    CREATE: "https://n8n.techno-insider.com/webhook/payments/lava/create",
    CANCEL: "https://n8n.techno-insider.com/webhook/payments/lava/cancel",
  },
};
