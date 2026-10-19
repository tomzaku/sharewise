import { useEffect, useReducer } from "react";
import type { Expense, Person } from "./split";

// A finished round of expenses (e.g. "badminton this week"), saved when a new session starts.
export type Session = {
  id: string;
  currency: string;
  people: Person[];
  expenses: Expense[];
  endedAt: number;
};

export type State = {
  currency: string;
  people: Person[];
  expenses: Expense[];
  sessions: Session[];
};

export type Action =
  | { type: "addPerson"; names: string[]; fallback: string }
  | { type: "renamePerson"; id: string; name: string }
  | { type: "removePerson"; id: string }
  | { type: "saveExpense"; expense: Expense }
  | { type: "removeExpense"; id: string }
  | { type: "clearExpenses" }
  | { type: "setCurrency"; currency: string }
  | { type: "newSession" }
  | { type: "deleteSession"; id: string }
  | { type: "restore"; state: State };

const STORAGE_KEY = "sharewise:v2";

const initialState: State = { currency: "VND", people: [], expenses: [], sessions: [] };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function randomName(taken: Person[], names: string[], fallback: string): string {
  const used = new Set(taken.map((p) => p.name));
  const free = names.filter((n) => !used.has(n));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  let i = taken.length + 1;
  while (used.has(`${fallback} ${i}`)) i++;
  return `${fallback} ${i}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "addPerson":
      return { ...state, people: [...state.people, { id: uid(), name: randomName(state.people, action.names, action.fallback) }] };
    case "renamePerson":
      return { ...state, people: state.people.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)) };
    case "removePerson":
      // Also drops the person from every expense; expenses left without payer or participants are removed.
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        expenses: state.expenses
          .filter((e) => e.paidBy !== action.id)
          .map((e) => ({ ...e, splitAmong: e.splitAmong.filter((id) => id !== action.id) }))
          .filter((e) => e.splitAmong.length > 0),
      };
    case "saveExpense": {
      const exists = state.expenses.some((e) => e.id === action.expense.id);
      return {
        ...state,
        expenses: exists
          ? state.expenses.map((e) => (e.id === action.expense.id ? action.expense : e))
          : [...state.expenses, action.expense],
      };
    }
    case "removeExpense":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
    case "clearExpenses":
      return { ...state, expenses: [] };
    case "setCurrency":
      return { ...state, currency: action.currency };
    case "restore":
      return action.state;
    case "newSession":
      // Archive the current expenses and keep the same people for the next round.
      if (!state.expenses.length) return state;
      return {
        ...state,
        expenses: [],
        sessions: [
          { id: uid(), currency: state.currency, people: state.people, expenses: state.expenses, endedAt: Date.now() },
          ...state.sessions,
        ],
      };
    case "deleteSession":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
  }
}

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.people) && Array.isArray(saved.expenses)) return { ...saved, sessions: saved.sessions ?? [] };
  } catch {}
  return initialState;
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);
  return [state, dispatch] as const;
}
