import { useMemo, useState } from "react";
import { useTelegram } from "../contexts/TelegramContext";
import { getDebugConfig } from "../lib/debug";
import { UserProfile } from "../types";

interface DebugPanelProps {
  profile: UserProfile | null;
  isProfileLoading: boolean;
}

const DebugPanel = ({ profile, isProfileLoading }: DebugPanelProps) => {
  const debugConfig = getDebugConfig();
  const { user, tg } = useTelegram();
  const [isOpen, setIsOpen] = useState(true);

  const diagnostics = useMemo(() => {
    const webApp = (window as any).Telegram?.WebApp;
    const url = window.location.href;
    return {
      currentPage: window.location.pathname || "/",
      href: url,
      search: window.location.search,
      hash: window.location.hash,
      hasTelegram: !!(window as any).Telegram,
      hasWebApp: !!webApp,
      initDataLen: webApp?.initData?.length ?? 0,
      userId: user?.id ?? null,
      debugTelegramId: debugConfig.telegramId,
      profileLoaded: !isProfileLoading,
      profileExists: !!profile,
    };
  }, [debugConfig.telegramId, isProfileLoading, profile, user?.id]);

  if (!debugConfig.isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-[90vw]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg"
      >
        Debug {isOpen ? "−" : "+"}
      </button>

      {isOpen && (
        <div className="mt-3 w-[92vw] sm:w-[520px] max-h-[60vh] overflow-auto rounded-2xl bg-slate-900/90 text-white text-xs p-4 shadow-2xl">
          <div className="space-y-2">
            <div><span className="font-semibold">currentPage:</span> {diagnostics.currentPage}</div>
            <div><span className="font-semibold">href:</span> {diagnostics.href}</div>
            <div><span className="font-semibold">search:</span> {diagnostics.search || "—"}</div>
            <div><span className="font-semibold">hash:</span> {diagnostics.hash || "—"}</div>
            <div><span className="font-semibold">hasTelegram:</span> {String(diagnostics.hasTelegram)}</div>
            <div><span className="font-semibold">hasWebApp:</span> {String(diagnostics.hasWebApp)}</div>
            <div><span className="font-semibold">initDataLen:</span> {diagnostics.initDataLen}</div>
            <div><span className="font-semibold">userId:</span> {diagnostics.userId ?? "—"}</div>
            <div><span className="font-semibold">debugTelegramId:</span> {diagnostics.debugTelegramId ?? "—"}</div>
            <div><span className="font-semibold">profileLoaded:</span> {String(diagnostics.profileLoaded)}</div>
            <div><span className="font-semibold">profileExists:</span> {String(diagnostics.profileExists)}</div>
            <div><span className="font-semibold">tgPlatform:</span> {tg?.platform || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
