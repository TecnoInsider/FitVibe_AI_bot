
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { initTelegram } from '../lib/telegram';
import Preloader from '../components/Preloader';

interface TelegramContextType {
    tg: any;
    user: any;
    isLoading: boolean;
    error: Error | null;
    hapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    };
    openLink: (url: string) => void;
    retry: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [telegramData, setTelegramData] = useState<{ tg: any; user: any }>({ tg: null, user: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const startInit = useCallback(() => {
        setIsLoading(true);
        setError(null);
        initTelegram()
            .then(({ tg, user }) => {
                // В браузере user будет, но tg.initData - нет. В телеграме должен быть и tg, и user
                if (!user && tg?.initData !== undefined) { 
                   throw new Error("Не удалось получить данные пользователя от Telegram.");
                }
                setTelegramData({ tg, user });
            })
            .catch((err: any) => {
                console.error("Telegram initialization failed:", err?.message || err, err?.diag || {});
                setError(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        startInit();
    }, [startInit]);


    const hapticFeedback = useMemo(() => ({
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
            telegramData.tg?.HapticFeedback?.impactOccurred?.(style);
        },
        notificationOccurred: (type: 'error' | 'success' | 'warning') => {
            telegramData.tg?.HapticFeedback?.notificationOccurred?.(type);
        },
    }), [telegramData.tg]);

    const openLink = useCallback((url: string) => {
        if (telegramData.tg?.openLink) {
            telegramData.tg.openLink(url, { try_instant_view: false });
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }, [telegramData.tg]);

    const contextValue = useMemo(() => ({
        ...telegramData,
        isLoading,
        error,
        hapticFeedback,
        openLink,
        retry: startInit,
    }), [telegramData, isLoading, error, hapticFeedback, openLink, startInit]);

    if (isLoading) {
        return <Preloader />;
    }

    if (error) {
        const anyErr = error as any;
        const diag = anyErr?.diag || {};
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка инициализации</h2>
                <p className="text-slate-700 mb-3">{error.message}</p>
                
                {Object.keys(diag).length > 0 && (
                    <pre className="text-left text-xs bg-slate-100 text-slate-700 p-3 rounded-lg max-w-full overflow-auto mb-4">
                        {JSON.stringify({
                            platform: diag.platform,
                            hasTg: diag.hasTg,
                            initDataLen: diag.initDataLen,
                            hasUnsafeUser: diag.hasUnsafeUser,
                            visibility: diag.visibility,
                        }, null, 2)}
                    </pre>
                )}

                <button
                    onClick={startInit}
                    className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white"
                >
                    Повторить
                </button>
            </div>
        );
    }
    
    return (
        <TelegramContext.Provider value={contextValue}>
            {children}
        </TelegramContext.Provider>
    );
};

export const useTelegram = (): TelegramContextType => {
    const context = useContext(TelegramContext);
    if (context === undefined) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
};
