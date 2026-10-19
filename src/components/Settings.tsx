import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { LANGS, useI18n } from "../lib/i18n";
import { CurrencyPicker } from "./CurrencyPicker";

export function LanguageToggle() {
  const { t, lang, setLang } = useI18n();
  return (
    <div role="group" aria-label={t.language} className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition ${
            lang === l ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

type Props = { currency: string; onCurrencyChange: (code: string) => void };

// Inline on wider screens; folded into a small menu on phones to keep the header uncluttered.
export function Settings({ currency, onCurrencyChange }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="hidden items-center gap-1.5 sm:flex">
        <LanguageToggle />
        <CurrencyPicker value={currency} onChange={onCurrencyChange} />
      </div>

      <div ref={rootRef} className="relative sm:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t.settings}
          className={`rounded-lg p-2 transition ${
            open ? "bg-slate-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-100" : "text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Settings2 className="size-4" />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-56 origin-top-right space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 motion-safe:animate-pop-in dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          >
            <Row label={t.language}>
              <LanguageToggle />
            </Row>
            <Row label={t.currency}>
              <CurrencyPicker
                value={currency}
                onChange={(code) => {
                  onCurrencyChange(code);
                  setOpen(false);
                }}
              />
            </Row>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </div>
  );
}
