import { useEffect, useReducer } from "react";
import type { Expense, Person } from "./split";

export type State = {
  currency: string;
  people: Person[];
  expenses: Expense[];
};

export type Action =
  | { type: "addPerson"; names: string[]; fallback: string }
  | { type: "renamePerson"; id: string; name: string }
  | { type: "removePerson"; id: string }
  | { type: "saveExpense"; expense: Expense }
  | { type: "removeExpense"; id: string }
  | { type: "clearExpenses" }
  | { type: "setCurrency"; currency: string }
  | { type: "restore"; state: State }
  | { type: "reset" };

const STORAGE_KEY = "sharewise:v2";


const initialState: State = { currency: "VND", people: [], expenses: [] };

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
    case "reset":
      return { ...initialState, currency: state.currency };
  }
}

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.people) && Array.isArray(saved.expenses)) return saved;
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
