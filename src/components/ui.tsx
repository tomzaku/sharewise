import type { ReactNode } from "react";
import type { Person } from "../lib/split";

const COLORS = [
  "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-orange-500", "bg-lime-600",
];

function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

const SIZES = { sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" };

export function Avatar({ person, size = "md" }: { person?: Person; size?: keyof typeof SIZES }) {
  const initials = person ? person.name.trim().slice(0, 2).toUpperCase() : "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-slate-900 ${SIZES[size]} ${person ? colorFor(person.id) : "bg-slate-400"}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="motion-safe:animate-fade-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </header>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      {children}
    </p>
  );
}
