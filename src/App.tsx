import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, RotateCcw, Split } from "lucide-react";
import { computeBalances, settle, type Expense, type Transfer } from "./lib/split";
import { uid, useStore, type State } from "./lib/store";
import { formatMoney } from "./lib/format";
import { useI18n } from "./lib/i18n";
import { People } from "./components/People";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { Balances, SettleUp } from "./components/Results";
import { Settings } from "./components/Settings";
import { Sessions } from "./components/Sessions";

type Toast = { id: number; message: string; undo?: State };

export default function App() {
  const [state, dispatch] = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const toastTimer = useRef<number>(undefined);

  const balances = useMemo(() => computeBalances(state.people, state.expenses), [state.people, state.expenses]);
  const transfers = useMemo(() => settle(balances), [balances]);
  const hasExpenses = state.expenses.length > 0;
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
        ? t.toastUpdated
        : t.toastAdded(nameOf(expense.paidBy), formatMoney(expense.amountCents, state.currency), expense.note),
      true,
    );
    setEditing(null);
  };

  const removeExpense = (e: Expense) => {
    if (editing?.id === e.id) setEditing(null);
    dispatch({ type: "removeExpense", id: e.id });
    notify(t.toastDeleted, true);
  };

  const clearHistory = () => {
    setEditing(null);
    dispatch({ type: "clearExpenses" });
    notify(t.toastHistoryCleared, true);
  };

  const removePerson = (id: string) => {
    if (editing && (editing.paidBy === id || editing.splitAmong.includes(id))) setEditing(null);
    dispatch({ type: "removePerson", id });
    notify(t.toastRemoved(nameOf(id)), true);
  };

  const markPaid = (tr: Transfer) => {
    dispatch({
      type: "saveExpense",
      expense: { id: uid(), kind: "payment", amountCents: tr.amountCents, paidBy: tr.from, splitAmong: [tr.to], createdAt: Date.now() },
    });
    notify(t.toastPaidBack(nameOf(tr.from), nameOf(tr.to)), true);
  };

  const newSession = () => {
    setEditing(null);
    dispatch({ type: "newSession" });
    notify(t.toastSessionSaved, true);
  };

  const deleteSession = (id: string) => {
    if (state.sessions.length === 1) setShowSessions(false);
    dispatch({ type: "deleteSession", id });
    notify(t.toastSessionDeleted, true);
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
            <p className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">{t.tagline}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Settings currency={state.currency} onCurrencyChange={(currency) => dispatch({ type: "setCurrency", currency })} />
            {/* Sessions stay out of the way: these only appear once they are useful. */}
            {state.sessions.length > 0 && (
              <button
                onClick={() => setShowSessions(true)}
                title={t.pastSessions}
                aria-label={t.pastSessions}
                className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 motion-safe:animate-pop-in dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Archive className="size-4" />
                <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-4 font-bold text-white">
                  {state.sessions.length}
                </span>
              </button>
            )}
            {hasExpenses && (
              <button
                onClick={newSession}
                title={t.newSession}
                aria-label={t.newSession}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
        </header>

        {/* Results only appear once there is something to show; until then keep a single, centered column. */}
        <div className={`grid gap-5 ${hasExpenses ? "lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_1fr] lg:items-start" : "mx-auto max-w-2xl"}`}>
          <div className="space-y-5">
            <People
              people={state.people}
              onAdd={() => dispatch({ type: "addPerson", names: t.names, fallback: t.friend })}
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
          </div>

          {hasExpenses && (
            <>
              {/* Mobile order: form → settle up → balances → history. Desktop: right column, spanning both rows. */}
              <div className="space-y-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <SettleUp people={state.people} transfers={transfers} currency={state.currency} onSettle={markPaid} />
                <Balances people={state.people} balances={balances} currency={state.currency} />
              </div>
              <div className="lg:col-start-1 lg:row-start-2">
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
            </>
          )}
        </div>
      </div>

      {showSessions && <Sessions sessions={state.sessions} onClose={() => setShowSessions(false)} onDelete={deleteSession} />}

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
              {t.undo}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
