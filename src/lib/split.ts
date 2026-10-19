// Core split logic. All money is handled in integer cents to avoid floating-point drift.

export type Person = { id: string; name: string };

export type Expense = {
  id: string;
  amountCents: number;
  paidBy: string;
  splitAmong: string[];
  createdAt: number;
  // "payment" records one person paying another back.
  kind: "expense" | "payment";
};

export type Balance = { paid: number; owed: number; net: number };
export type Transfer = { from: string; to: string; amountCents: number };

// Parses user input like "12.50" or "100,000" into cents; returns null if invalid.
export function parseAmount(input: string): number | null {
  const n = Number(input.replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

// Split `totalCents` equally among `ids`; leftover cents go to the first participants.
export function splitEqually(totalCents: number, ids: string[]): Record<string, number> {
  const base = Math.floor(totalCents / ids.length);
  let remainder = totalCents - base * ids.length;
  const shares: Record<string, number> = {};
  for (const id of ids) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return shares;
}

// net > 0 means the person should receive money.
export function computeBalances(people: Person[], expenses: Expense[]): Record<string, Balance> {
  const balances: Record<string, Balance> = {};
  for (const p of people) balances[p.id] = { paid: 0, owed: 0, net: 0 };

  for (const e of expenses) {
    const participants = e.splitAmong.filter((id) => balances[id]);
    if (!balances[e.paidBy] || participants.length === 0) continue;
    balances[e.paidBy].paid += e.amountCents;
    const shares = splitEqually(e.amountCents, participants);
    for (const id of participants) balances[id].owed += shares[id];
  }

  for (const id in balances) balances[id].net = balances[id].paid - balances[id].owed;
  return balances;
}

// Greedy settlement: repeatedly match the largest debtor with the largest creditor.
// Produces at most (n - 1) transfers.
export function settle(balances: Record<string, Balance>): Transfer[] {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];
  for (const id in balances) {
    const net = balances[id].net;
    if (net < 0) debtors.push({ id, amount: -net });
    else if (net > 0) creditors.push({ id, amount: net });
  }

  const transfers: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.amount, c.amount);
    transfers.push({ from: d.id, to: c.id, amountCents: amount });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount === 0) debtors.shift();
    if (c.amount === 0) creditors.shift();
  }
  return transfers;
}
