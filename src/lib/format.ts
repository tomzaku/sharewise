export const CURRENCIES = [
  { code: "VND", flag: "🇻🇳" },
  { code: "USD", flag: "🇺🇸" },
  { code: "EUR", flag: "🇪🇺" },
  { code: "GBP", flag: "🇬🇧" },
  { code: "JPY", flag: "🇯🇵" },
  { code: "KRW", flag: "🇰🇷" },
  { code: "CNY", flag: "🇨🇳" },
  { code: "SGD", flag: "🇸🇬" },
  { code: "THB", flag: "🇹🇭" },
  { code: "AUD", flag: "🇦🇺" },
];

export function currencyName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames(lang, { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

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

export function timeAgo(ts: number, lang: string, justNow: string): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return justNow;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  const m = Math.round(s / 60);
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.round(m / 60);
  if (h < 24) return rtf.format(-h, "hour");
  return new Date(ts).toLocaleDateString(lang);
}
