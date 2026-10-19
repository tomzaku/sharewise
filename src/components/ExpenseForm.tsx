import { useEffect, useRef, useState } from "react";
import { Check, Receipt } from "lucide-react";
import { parseAmount, type Expense, type Person } from "../lib/split";
import { uid } from "../lib/store";
import { currencySymbol, formatMoney } from "../lib/format";
import { Avatar, Card } from "./ui";

type Props = {
  people: Person[];
  currency: string;
  editing: Expense | null;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
};

export function ExpenseForm({ people, currency, editing, onSave, onCancel }: Props) {
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(people[0]?.id ?? "");
  const [split, setSplit] = useState<Set<string>>(() => new Set(people.map((p) => p.id)));
  const amountRef = useRef<HTMLInputElement>(null);
  const knownIds = useRef(people.map((p) => p.id));

  // Keep payer/split in sync as people are added or removed; newcomers join the split by default.
  useEffect(() => {
    const known = new Set(knownIds.current);
    const ids = new Set(people.map((p) => p.id));
    setSplit((s) => {
      const next = new Set([...s].filter((id) => ids.has(id)));
      for (const id of ids) if (!known.has(id)) next.add(id);
      return next;
    });
    setPaidBy((cur) => (ids.has(cur) ? cur : (people[0]?.id ?? "")));
    knownIds.current = [...ids];
  }, [people]);

  useEffect(() => {
    if (!editing) return;
    setAmount(String(editing.amountCents / 100));
    setPaidBy(editing.paidBy);
    setSplit(new Set(editing.splitAmong));
    amountRef.current?.focus();
  }, [editing]);

  const cents = parseAmount(amount);
  const valid = cents !== null && paidBy && split.size > 0;
  const allSelected = split.size === people.length;

  const toggle = (id: string) =>
    setSplit((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      id: editing?.id ?? uid(),
      createdAt: editing?.createdAt ?? Date.now(),
      kind: "expense",
      amountCents: cents,
      paidBy,
      splitAmong: people.filter((p) => split.has(p.id)).map((p) => p.id),
    });
    setAmount("");
    amountRef.current?.focus();
  };

  const cancel = () => {
    setAmount("");
    onCancel();
  };

  const hint =
    cents === null ? "Enter an amount" : split.size === 0 ? "Pick who shares this" : `${formatMoney(Math.ceil(cents / split.size), currency)} each`;

  return (
    <Card title={editing ? "Edit expense" : "Add expense"} icon={<Receipt className="size-5" />}>
      <form onSubmit={submit} className="space-y-5">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-900">
          <span className="text-xl font-semibold text-slate-400">{currencySymbol(currency)}</span>
          <input
            ref={amountRef}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            aria-label="Amount"
            className="w-full bg-transparent py-3 text-3xl font-semibold tabular-nums outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
        </label>

        <Field label="Paid by">
          {people.map((p) => (
            <Pill key={p.id} person={p} selected={paidBy === p.id} onClick={() => setPaidBy(p.id)} />
          ))}
        </Field>

        <Field
          label="Split with"
          action={
            <button
              type="button"
              onClick={() => setSplit(allSelected ? new Set() : new Set(people.map((p) => p.id)))}
              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {allSelected ? "Clear" : "Everyone"}
            </button>
          }
        >
          {people.map((p) => (
            <Pill key={p.id} person={p} selected={split.has(p.id)} onClick={() => toggle(p.id)} check />
          ))}
        </Field>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 tabular-nums dark:text-slate-400">{hint}</span>
          <div className="ml-auto flex gap-2">
            {editing && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
            <button
              disabled={!valid}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              {editing ? "Save" : "Add expense"}
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center">
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</span>
        <span className="ml-auto">{action}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({ person, selected, onClick, check }: { person: Person; selected: boolean; onClick: () => void; check?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-9 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition active:scale-95 ${
        selected
          ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
      }`}
    >
      <span className={`relative transition ${selected ? "" : "opacity-50 grayscale"}`}>
        <Avatar person={person} size="sm" />
        {check && selected && (
          <Check className="absolute -right-1 -bottom-1 size-3 rounded-full bg-emerald-600 p-0.5 text-white" strokeWidth={4} />
        )}
      </span>
      {person.name}
    </button>
  );
}
