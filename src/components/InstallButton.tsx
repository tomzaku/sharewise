import { useEffect, useRef, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { useI18n } from "../lib/i18n";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The browser can fire this before React mounts, so capture it at module load.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as InstallPromptEvent;
  listeners.forEach((l) => l());
});
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  listeners.forEach((l) => l());
});

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

// iOS never fires beforeinstallprompt; installing there is a manual Share → Add to Home Screen.
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function InstallButton() {
  const { t } = useI18n();
  const [, rerender] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);

  useEffect(() => {
    if (!showSteps) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setShowSteps(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [showSteps]);

  if (isStandalone() || (!deferredPrompt && !isIOS())) return null;

  const install = async () => {
    if (!deferredPrompt) {
      setShowSteps((s) => !s);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    rerender((n) => n + 1);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={install}
        title={t.install}
        aria-label={t.install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 p-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 motion-safe:animate-pop-in sm:px-3"
      >
        <Download className="size-4" />
        <span className="hidden sm:inline">{t.install}</span>
      </button>

      {showSteps && (
        <div className="absolute right-0 z-40 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 motion-safe:animate-pop-in dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
          <p className="mb-3 text-sm font-semibold">{t.installIos}</p>
          <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <Step n={1} icon={<Share className="size-4" />}>
              {t.iosStep1}
            </Step>
            <Step n={2} icon={<SquarePlus className="size-4" />}>
              {t.iosStep2}
            </Step>
          </ol>
        </div>
      )}
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
        {n}
      </span>
      <span className="flex-1">{children}</span>
      <span className="text-sky-600 dark:text-sky-400">{icon}</span>
    </li>
  );
}
