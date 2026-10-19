import { useState } from "react";
import { Plus, Users, X } from "lucide-react";
import type { Person } from "../lib/split";
import { useI18n } from "../lib/i18n";
import { Avatar, Card } from "./ui";

type Props = {
  people: Person[];
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

export function People({ people, onAdd, onRename, onRemove }: Props) {
  const { t } = useI18n();
  return (
    <Card
      title={t.people}
      icon={<Users className="size-5" />}
      action={people.length > 0 && <span className="text-xs text-slate-400">{t.tapToRename}</span>}
    >
      <ul className="flex flex-wrap gap-2">
        {people.map((p) => (
          <PersonChip key={p.id} person={p} onRename={(name) => onRename(p.id, name)} onRemove={() => onRemove(p.id)} />
        ))}
        <li>
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-emerald-400 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 active:scale-95 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <Plus className="size-4" /> {t.addPerson}
          </button>
        </li>
      </ul>
    </Card>
  );
}

function PersonChip({ person, onRename, onRemove }: { person: Person; onRename: (name: string) => void; onRemove: () => void }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const name = draft?.trim();
    if (name && name !== person.name) onRename(name);
    setDraft(null);
  };

  return (
    <li className="group inline-flex h-10 motion-safe:animate-pop-in items-center gap-2 rounded-full bg-slate-100 py-1 pr-1.5 pl-1 dark:bg-slate-800">
      <Avatar person={person} />
      {draft === null ? (
        <button onClick={() => setDraft(person.name)} className="text-sm font-medium hover:underline">
          {person.name}
        </button>
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(null);
          }}
          className="w-24 rounded-md bg-white px-1.5 text-sm font-medium outline-none ring-2 ring-emerald-500 dark:bg-slate-900"
        />
      )}
      <button
        onClick={onRemove}
        aria-label={t.remove(person.name)}
        className="rounded-full p-1 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}
