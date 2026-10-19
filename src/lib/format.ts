export const CURRENCIES = ["VND", "USD", "EUR", "GBP", "JPY", "KRW", "SGD", "THB"];

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency: string): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(undefined, { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f.format(cents / 100);
}

export function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

export function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}
