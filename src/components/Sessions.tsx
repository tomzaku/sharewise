import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, HandCoins, Sparkles, Trash2, X } from "lucide-react";
import { computeBalances, settle } from "../lib/split";
import type { Session } from "../lib/store";
import { formatMoney } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Avatar } from "./ui";

type Props = {
  sessions: Session[];
  onClose: () => void;
  onDelete: (id: string) => void;
};

function summarize(s: Session, lang: string) {
  const times = s.expenses.map((e) => e.createdAt);
  const start = new Date(Math.min(...times));
  const end = new Date(Math.max(...times));
  const dtf = new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" });
  const dates = start.toDateString() === end.toDateString() ? dtf.format(start) : dtf.formatRange(start, end);
  const items = s.expenses.filter((e) => e.kind === "expense");
  const notes = [...new Set(items.map((e) => e.note).filter(Boolean))];
  return {
    title: notes.slice(0, 3).join(", ") || dates,
    dates,
    total: items.reduce((sum, e) => sum + e.amountCents, 0),
  };
}

export function Sessions({ sessions, onClose, onDelete }: Props) {
  const { t, lang } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const session = sessions.find((s) => s.id === openId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openId) setOpenId(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [openId, onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-safe:animate-fade-in" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal
        aria-label={t.pastSessions}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl motion-safe:animate-sheet-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none dark:bg-slate-900"
      >
        <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          {session && (
            <button
              onClick={() => setOpenId(null)}
              aria-label={t.back}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <h2 className="font-semibold">{t.pastSessions}</h2>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="ml-auto rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {session ? (
            <SessionDetail key={session.id} session={session} onDelete={() => {
              setOpenId(null);
              onDelete(session.id);
            }} />
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const { title, dates, total } = summarize(s, lang);
                return (
                  <li key={s.id} className="motion-safe:animate-slide-in">
                    <button
                      onClick={() => setOpenId(s.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
                    >
                      <div className="flex -space-x-2">
                        {s.people.slice(0, 3).map((p) => (
                          <Avatar key={p.id} person={p} size="sm" />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {dates} · {t.peopleCount(s.people.length)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(total, s.currency)}</span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function SessionDetail({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const { t, lang } = useI18n();
  const { title, dates, total } = summarize(session, lang);
  const byId = new Map(session.people.map((p) => [p.id, p]));
  const transfers = useMemo(() => settle(computeBalances(session.people, session.expenses)), [session]);
  const money = (cents: number) => formatMoney(cents, session.currency);
  const sorted = [...session.expenses].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-5 motion-safe:animate-slide-in">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{dates}</p>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-slate-500 tabular-nums dark:text-slate-400">{t.total(money(total))}</p>
      </div>

      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-4 text-white">
        <h4 className="mb-2 text-sm font-semibold">{t.settleUp}</h4>
        {transfers.length === 0 ? (
          <p className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-amber-200" /> {t.allSettled}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {transfers.map((tr) => (
              <li key={`${tr.from}-${tr.to}`} className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm">
                <span className="font-semibold">{byId.get(tr.from)?.name}</span>
                <ArrowRight className="size-3.5 opacity-70" />
                <span className="font-semibold">{byId.get(tr.to)?.name}</span>
                <span className="ml-auto font-bold tabular-nums">{money(tr.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{t.expensesTitle}</h4>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((e) => {
            const payer = byId.get(e.paidBy);
            const isPayment = e.kind === "payment";
            return (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                {isPayment ? (
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    <HandCoins className="size-3.5" />
                  </span>
                ) : (
                  <Avatar person={payer} size="sm" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {isPayment ? `${payer?.name} → ${byId.get(e.splitAmong[0])?.name}` : e.note || t.personPaid(payer?.name ?? "?")}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {isPayment ? t.paidBack : e.note ? t.personPaid(payer?.name ?? "?") : ""}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${isPayment ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {money(e.amountCents)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        onClick={onDelete}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
      >
        <Trash2 className="size-4" /> {t.deleteSession}
      </button>
    </div>
  );
}
