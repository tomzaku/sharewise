import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Split } from "lucide-react";
import { computeBalances, settle, type Expense, type Transfer } from "./lib/split";
import { uid, useStore, type State } from "./lib/store";
import { CURRENCIES, formatMoney } from "./lib/format";
import { People } from "./components/People";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { Balances, SettleUp } from "./components/Results";

type Toast = { id: number; message: string; undo?: State };

export default function App() {
  const [state, dispatch] = useStore();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number>(undefined);

  const balances = useMemo(() => computeBalances(state.people, state.expenses), [state.people, state.expenses]);
  const transfers = useMemo(() => settle(balances), [balances]);
  const nameOf = (id: string) => state.people.find((p) => p.id === id)?.name ?? "?";

  const notify = (message: string, undoable = false) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, undo: undoable ? state : undefined });
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const saveExpense = (expense: Expense) => {
    dispatch({ type: "saveExpense", expense });
    notify(
      editing
        ? "Expense updated"
        : `${nameOf(expense.paidBy)} paid ${formatMoney(expense.amountCents, state.currency)}${expense.note ? ` for ${expense.note}` : ""}`,
      true,
    );
    setEditing(null);
  };

  const removeExpense = (e: Expense) => {
    if (editing?.id === e.id) setEditing(null);
    dispatch({ type: "removeExpense", id: e.id });
    notify("Deleted", true);
  };

  const clearHistory = () => {
    setEditing(null);
    dispatch({ type: "clearExpenses" });
    notify("History cleared", true);
  };

  const removePerson = (id: string) => {
    if (editing && (editing.paidBy === id || editing.splitAmong.includes(id))) setEditing(null);
    dispatch({ type: "removePerson", id });
    notify(`Removed ${nameOf(id)}`, true);
  };

  const markPaid = (t: Transfer) => {
    dispatch({
      type: "saveExpense",
      expense: { id: uid(), kind: "payment", amountCents: t.amountCents, paidBy: t.from, splitAmong: [t.to], createdAt: Date.now() },
    });
    notify(`${nameOf(t.from)} paid back ${nameOf(t.to)}`, true);
  };

  const reset = () => {
    setEditing(null);
    dispatch({ type: "reset" });
    notify("Started over", true);
  };

  const undo = () => {
    if (!toast?.undo) return;
    dispatch({ type: "restore", state: toast.undo });
    setEditing(null);
    setToast(null);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50/80 via-slate-50 to-slate-50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <header className="flex items-center gap-3 py-6">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Split className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ShareWise</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Split bills, settle fast.</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <select
              value={state.currency}
              onChange={(e) => dispatch({ type: "setCurrency", currency: e.target.value })}
              aria-label="Currency"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {(state.people.length > 0 || state.expenses.length > 0) && (
              <button
                onClick={reset}
                title="Start over"
                aria-label="Start over"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-5">
            <People
              people={state.people}
              onAdd={() => dispatch({ type: "addPerson" })}
              onRename={(id, name) => dispatch({ type: "renamePerson", id, name })}
              onRemove={removePerson}
            />
            {state.people.length > 0 && (
              <ExpenseForm
                people={state.people}
                currency={state.currency}
                editing={editing}
                onSave={saveExpense}
                onCancel={() => setEditing(null)}
              />
            )}
            <ExpenseList
              people={state.people}
              expenses={state.expenses}
              currency={state.currency}
              editingId={editing?.id}
              onEdit={setEditing}
              onRemove={removeExpense}
              onClear={clearHistory}
            />
          </div>

          <div className="space-y-5 lg:sticky lg:top-6">
            <SettleUp
              people={state.people}
              transfers={transfers}
              currency={state.currency}
              hasExpenses={state.expenses.length > 0}
              onSettle={markPaid}
            />
            <Balances people={state.people} balances={balances} currency={state.currency} />
          </div>
        </div>
      </div>

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 motion-safe:animate-toast-in items-center gap-4 rounded-full bg-slate-900 py-2.5 pr-2.5 pl-5 text-sm text-white shadow-xl dark:bg-white dark:text-slate-900"
        >
          <span className="whitespace-nowrap">{toast.message}</span>
          {toast.undo && (
            <button
              onClick={undo}
              className="rounded-full bg-white/15 px-3 py-1 font-semibold transition hover:bg-white/25 dark:bg-slate-900/10 dark:hover:bg-slate-900/20"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
