import { ArrowRight, HandCoins, History, Pencil, Trash2 } from "lucide-react";
import type { Expense, Person } from "../lib/split";
import { formatMoney, timeAgo } from "../lib/format";
import { Avatar, Card, Empty } from "./ui";

type Props = {
  people: Person[];
  expenses: Expense[];
  currency: string;
  editingId?: string;
  onEdit: (e: Expense) => void;
  onRemove: (e: Expense) => void;
};

export function ExpenseList({ people, expenses, currency, editingId, onEdit, onRemove }: Props) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
  const total = expenses.filter((e) => e.kind === "expense").reduce((s, e) => s + e.amountCents, 0);

  return (
    <Card
      title="History"
      icon={<History className="size-5" />}
      action={total > 0 && <span className="text-sm text-slate-500 tabular-nums dark:text-slate-400">Total {formatMoney(total, currency)}</span>}
    >
      {sorted.length === 0 ? (
        <Empty>No expenses yet.</Empty>
      ) : (
        <ul className="-mx-2">
          {sorted.map((e) => {
            const payer = byId.get(e.paidBy);
            const isPayment = e.kind === "payment";
            const splitLabel =
              e.splitAmong.length === people.length
                ? "everyone"
                : e.splitAmong.map((id) => byId.get(id)?.name ?? "?").join(", ");
            return (
              <li
                key={e.id}
                className={`group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  editingId === e.id ? "bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-950/50 dark:ring-emerald-800" : ""
                }`}
              >
                {isPayment ? (
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    <HandCoins className="size-4" />
                  </span>
                ) : (
                  <Avatar person={payer} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium">
                    {isPayment ? (
                      <>
                        {payer?.name} <ArrowRight className="size-3.5 text-slate-400" /> {byId.get(e.splitAmong[0])?.name}
                      </>
                    ) : (
                      <>{e.note || `${payer?.name} paid`}</>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {isPayment ? "Paid back" : `${e.note ? `${payer?.name} paid · ` : ""}Split with ${splitLabel}`} · {timeAgo(e.createdAt)}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${isPayment ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {formatMoney(e.amountCents, currency)}
                </span>
                <div className="flex opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {!isPayment && (
                    <IconButton label="Edit" onClick={() => onEdit(e)}>
                      <Pencil className="size-4" />
                    </IconButton>
                  )}
                  <IconButton label="Delete" onClick={() => onRemove(e)} danger>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 text-slate-400 transition ${
        danger ? "hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950" : "hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
