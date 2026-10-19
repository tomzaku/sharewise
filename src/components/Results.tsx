import { useState } from "react";
import { ArrowRight, Check, Copy, Scale, Sparkles, Wallet } from "lucide-react";
import type { Balance, Person, Transfer } from "../lib/split";
import { formatMoney } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Avatar, Card } from "./ui";

export function Balances({ people, balances, currency }: { people: Person[]; balances: Record<string, Balance>; currency: string }) {
  const { t } = useI18n();
  const max = Math.max(1, ...people.map((p) => Math.abs(balances[p.id]?.net ?? 0)));

  return (
    <Card title={t.balances} icon={<Scale className="size-5" />}>
      <ul className="space-y-3">
          {people.map((p) => {
            const b = balances[p.id];
            const pct = (Math.abs(b.net) / max) * 50;
            return (
              <li key={p.id} className="flex items-center gap-3">
                <Avatar person={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        b.net > 0 ? "text-emerald-600 dark:text-emerald-400" : b.net < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {b.net > 0 ? "+" : b.net < 0 ? "−" : ""}
                      {formatMoney(Math.abs(b.net), currency)}
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className="absolute top-[-2px] left-1/2 h-2.5 w-px bg-slate-300 dark:bg-slate-600" />
                    <span
                      className={`absolute top-0 h-full rounded-full transition-all duration-500 ${b.net >= 0 ? "left-1/2 bg-emerald-500" : "bg-rose-500"}`}
                      style={b.net >= 0 ? { width: `${pct}%` } : { width: `${pct}%`, right: "50%" }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {t.paidShare(formatMoney(b.paid, currency), formatMoney(b.owed, currency))}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
    </Card>
  );
}

type SettleProps = {
  people: Person[];
  transfers: Transfer[];
  currency: string;
  onSettle: (t: Transfer) => void;
};

export function SettleUp({ people, transfers, currency, onSettle }: SettleProps) {
  const { t: tr } = useI18n();
  const byId = new Map(people.map((p) => [p.id, p]));
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  // Let the row slide out before the payment is recorded and the list recomputes.
  const markPaid = (t: Transfer) => {
    setLeaving(`${t.from}-${t.to}`);
    setTimeout(() => {
      onSettle(t);
      setLeaving(null);
    }, 250);
  };

  const copy = async () => {
    const text = transfers
      .map((t) => `${byId.get(t.from)?.name} → ${byId.get(t.to)?.name}: ${formatMoney(t.amountCents, currency)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    // The hero card: this is what people open the app for, so it gets the strongest visual weight.
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-xl shadow-emerald-600/25 motion-safe:animate-fade-up dark:shadow-emerald-950/50">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-teal-300/20 blur-2xl" />

      <header className="relative mb-4 flex items-start gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
          <Wallet className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-tight font-bold">{tr.settleUp}</h2>
          {transfers.length > 0 && <p className="text-sm text-emerald-50/80">{tr.paymentsLeft(transfers.length)}</p>}
        </div>
        {transfers.length > 0 && (
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? tr.copied : tr.copy}
          </button>
        )}
      </header>

      {transfers.length === 0 ? (
        <div className="relative flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="size-10 text-amber-200 motion-safe:animate-celebrate" />
          <p className="text-lg font-bold">{tr.allSettled}</p>
          <p className="text-sm text-emerald-50/80">{tr.nobodyOwes}</p>
        </div>
      ) : (
        <ul className="relative space-y-2.5">
          {transfers.map((t) => {
            const from = byId.get(t.from);
            const to = byId.get(t.to);
            return (
              <li
                key={`${t.from}-${t.to}`}
                className={`flex items-center gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-lg shadow-emerald-900/15 dark:bg-slate-900 dark:text-slate-100 ${
                  leaving === `${t.from}-${t.to}` ? "pointer-events-none motion-safe:animate-slide-out" : "motion-safe:animate-slide-in"
                }`}
              >
                <div className="flex shrink-0 items-center gap-1">
                  <Avatar person={from} />
                  <ArrowRight className="size-3.5 text-slate-400" />
                  <Avatar person={to} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{from?.name}</span> → {to?.name}
                  </p>
                  <p className="text-lg leading-tight font-bold tabular-nums">{formatMoney(t.amountCents, currency)}</p>
                </div>
                <button
                  onClick={() => markPaid(t)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
                >
                  <Check className="size-3.5" /> {tr.markPaid}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
