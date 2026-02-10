export interface DebugConfig {
  isEnabled: boolean;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramName: string | null;
}

export const getDebugConfig = (): DebugConfig => {
  if (typeof window === "undefined") {
    return {
      isEnabled: false,
      telegramId: null,
      telegramUsername: null,
      telegramName: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const isEnabled =
    params.get("debug") === "1" || params.get("debug_telegram") === "1";

  const telegramId =
    params.get("telegram_id") ||
    params.get("tg_id") ||
    params.get("chat_id");

  const telegramUsername = params.get("username");
  const telegramName = params.get("name");

  return {
    isEnabled,
    telegramId,
    telegramUsername,
    telegramName,
  };
};
