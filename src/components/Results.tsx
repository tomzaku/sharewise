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
    <Card
      title={tr.settleUp}
      icon={<Wallet className="size-5" />}
      action={
        transfers.length > 0 && (
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? tr.copied : tr.copy}
          </button>
        )
      }
    >
      {transfers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="size-8 text-emerald-500 motion-safe:animate-celebrate" />
            <p className="font-medium">{tr.allSettled}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tr.nobodyOwes}</p>
          </div>
      ) : (
        <ul className="space-y-2">
          {transfers.map((t) => {
            const from = byId.get(t.from);
            const to = byId.get(t.to);
            return (
              <li
                key={`${t.from}-${t.to}`}
                className={`flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 ${
                  leaving === `${t.from}-${t.to}` ? "pointer-events-none motion-safe:animate-slide-out" : "motion-safe:animate-slide-in"
                }`}
              >
                <div className="flex -space-x-2">
                  <Avatar person={from} />
                  <Avatar person={to} />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold">{from?.name}</span>
                    <ArrowRight className="size-3.5 text-slate-400" />
                    <span className="font-semibold">{to?.name}</span>
                  </p>
                  <p className="text-base font-bold text-rose-600 tabular-nums dark:text-rose-400">{formatMoney(t.amountCents, currency)}</p>
                </div>
                <button
                  onClick={() => markPaid(t)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-600 hover:text-white hover:ring-emerald-600 active:scale-95 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-600 dark:hover:text-white"
                >
                  <Check className="size-3.5" /> {tr.markPaid}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
