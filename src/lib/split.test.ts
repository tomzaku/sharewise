import { describe, expect, test } from "vitest";
import { computeBalances, parseAmount, settle, splitEqually, type Expense } from "./split";

const people = [
  { id: "a", name: "An" },
  { id: "b", name: "Binh" },
  { id: "c", name: "Chi" },
];

const exp = (paidBy: string, amountCents: number, splitAmong: string[]): Expense => ({
  id: Math.random().toString(),
  paidBy,
  amountCents,
  splitAmong,
  createdAt: 0,
  kind: "expense",
});

describe("split", () => {
  test("parseAmount handles separators and rejects bad input", () => {
    expect(parseAmount("10.005")).toBe(1001);
    expect(parseAmount("100,000")).toBe(10_000_000);
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  test("splitEqually distributes leftover cents", () => {
    expect(splitEqually(1000, ["a", "b", "c"])).toEqual({ a: 334, b: 333, c: 333 });
  });

  test("balances and settlement", () => {
    const balances = computeBalances(people, [exp("a", 9000, ["a", "b", "c"]), exp("b", 3000, ["a", "b"])]);
    expect(balances.a).toEqual({ paid: 9000, owed: 4500, net: 4500 });
    expect(balances.b).toEqual({ paid: 3000, owed: 4500, net: -1500 });
    expect(balances.c).toEqual({ paid: 0, owed: 3000, net: -3000 });
    expect(settle(balances)).toEqual([
      { from: "c", to: "a", amountCents: 3000 },
      { from: "b", to: "a", amountCents: 1500 },
    ]);
  });

  test("a recorded payment settles the debt", () => {
    const balances = computeBalances(people, [exp("a", 3000, ["a", "b", "c"]), exp("b", 1000, ["a"]), exp("c", 1000, ["a"])]);
    expect(settle(balances)).toEqual([]);
  });

  test("expenses referencing removed people are ignored", () => {
    const balances = computeBalances(people, [exp("x", 500, ["a"]), exp("a", 600, ["a", "x"])]);
    expect(balances.a.net).toBe(0);
  });
});
