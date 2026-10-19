import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, currencyName, currencySymbol } from "../lib/format";
import { useI18n } from "../lib/i18n";

export function CurrencyPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const current = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>("[aria-selected=true]")?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") items[(i + 1) % items.length]?.focus();
    else if (e.key === "ArrowUp") items[(i - 1 + items.length) % items.length]?.focus();
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.currency}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 pr-2 pl-2.5 text-sm font-semibold transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      >
        <span className="text-base leading-none">{current.flag}</span>
        {current.code}
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t.currency}
          onKeyDown={onListKey}
          className="absolute right-0 z-40 mt-2 max-h-80 w-64 origin-top-right overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 motion-safe:animate-pop-in dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
        >
          {CURRENCIES.map((c) => {
            const selected = c.code === value;
            return (
              <li key={c.code}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(c.code);
                    close();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 ${
                    selected ? "bg-emerald-50 dark:bg-emerald-950/60" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{c.code}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{currencyName(c.code, lang)}</span>
                  </span>
                  <span className="text-sm text-slate-400 tabular-nums">{currencySymbol(c.code)}</span>
                  <Check className={`size-4 text-emerald-600 ${selected ? "" : "invisible"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
