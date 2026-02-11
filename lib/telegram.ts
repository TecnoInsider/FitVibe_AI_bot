// lib/telegram.ts — гибридная инициализация + диагностика (исправлено)

import { getDebugConfig } from './debug';

declare global {
  interface Window { Telegram: any; }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface InitResult {
  tg: any;
  user: TelegramUser | null;
}

const getPlatform = (tg?: any) => {
  try {
    if (tg?.platform) return tg.platform;
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  } catch {}
  return 'web';
};

const diagSnapshot = (tg?: any) => ({
  platform: getPlatform(tg),
  ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
  hasTg: !!tg,
  initDataLen: tg?.initData?.length ?? 0,
  hasUnsafeUser: !!tg?.initDataUnsafe?.user?.id,
  visibility: typeof document !== 'undefined' ? document.visibilityState : 'n/a',
  ts: Date.now(),
});


export const initTelegram = (): Promise<InitResult> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve({ tg: null, user: null });
    }

    const tg = window.Telegram?.WebApp;
    const debugConfig = getDebugConfig();
    console.log('[Debug] init start', diagSnapshot(tg));

    if (debugConfig.isEnabled && !tg?.initDataUnsafe?.user?.id) {
      const debugUserId = debugConfig.telegramId;
      const resolvedId = debugUserId ? Number(debugUserId) : 377484655;
      const resolvedName = debugConfig.telegramName || '';
      const resolvedUsername = debugConfig.telegramUsername || '';
      const fallbackTg = tg || {
        ready: () => {},
        expand: () => {},
        HapticFeedback: {
          impactOccurred: (style: string) => console.log(`Haptic impact: ${style}`),
          notificationOccurred: (type: string) => console.log(`Haptic notification: ${type}`),
        },
        openLink: (url: string) => window.open(url, '_blank'),
        platform: getPlatform(),
      };

      console.log('[Debug] Debug mode active -> mock user');
      return resolve({
        tg: fallbackTg,
        user: {
          id: resolvedId,
          first_name: resolvedName,
          username: resolvedUsername,
        },
      });
    }

    // ✅ Если Telegram SDK недоступен — это действительно браузер (dev)
    if (!tg) {
      const debugUserId = debugConfig.isEnabled ? debugConfig.telegramId : null;
      const resolvedId = debugUserId ? Number(debugUserId) : 377484655;
      const resolvedName = debugConfig.telegramName || '';
      const resolvedUsername = debugConfig.telegramUsername || '';
      console.log('[Debug] No Telegram SDK -> mock mode');
      return resolve({
        tg: {
          ready: () => {},
          expand: () => {},
          HapticFeedback: {
            impactOccurred: (style: string) => console.log(`Haptic impact: ${style}`),
            notificationOccurred: (type: string) => console.log(`Haptic notification: ${type}`),
          },
          openLink: (url: string) => window.open(url, '_blank'),
          platform: getPlatform(),
        },
        user: {
          id: resolvedId,
          first_name: resolvedName,
          username: resolvedUsername,
        },
      });
    }

    // --- Реальная среда Telegram ---
    let isSettled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const settleOnce = (fn: () => void) => {
      if (!isSettled) {
        isSettled = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
        try { fn(); } catch (e) { console.error(e); }
      }
    };

    const platform = getPlatform(tg);
    const TIMEOUT_MS = platform === 'android' ? 9000 : 5000;

    // ⏱ Таймаут безопасности
    timeoutId = setTimeout(() => {
      const snapshot = diagSnapshot(tg);
      console.error('[Debug] Telegram initialization timed out.', snapshot);
      settleOnce(() => {
        const err: any = new Error('Не удалось инициализировать Telegram: превышено время ожидания.');
        err.diag = snapshot;
        reject(err);
      });
    }, TIMEOUT_MS);

    // 🟢 Быстрый путь (часто iOS)
    if (tg.initDataUnsafe?.user?.id) {
      console.log('[Debug] Fast path: user present immediately.');
      try { tg.expand?.(); } catch {}
      return settleOnce(() => resolve({ tg, user: tg.initDataUnsafe.user }));
    }

    // 🟡 Официальный сигнал готовности (не блокирует ожидание)
    try { tg.ready?.(); } catch(e) { console.error('[Debug] tg.ready() call failed', e); }

    // 🔁 Активный опрос каждые 50мс (надёжный для «медленных» клиентов)
    intervalId = setInterval(() => {
      const user = tg.initDataUnsafe?.user;
      if (user?.id) {
        console.log('[Debug] Polling success: user acquired.');
        try { tg.expand?.(); } catch {}
        settleOnce(() => resolve({ tg, user }));
      }
    }, 50);
  });
};
