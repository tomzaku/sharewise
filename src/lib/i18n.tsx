import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "vi";
export const LANGS: Lang[] = ["en", "vi"];

const en = {
  tagline: "Split bills, settle fast.",
  currency: "Currency",
  language: "Language",
  startOver: "Start over",
  undo: "Undo",

  people: "People",
  tapToRename: "Tap a name to rename",
  addPerson: "Add person",
  remove: (name: string) => `Remove ${name}`,

  addExpense: "Add expense",
  editExpense: "Edit expense",
  amount: "Amount",
  whatFor: "What for? (optional)",
  paidBy: "Paid by",
  splitWith: "Split with",
  everyone: "Everyone",
  clearSelection: "Clear",
  save: "Save",
  cancel: "Cancel",
  enterAmount: "Enter an amount",
  pickWho: "Pick who shares this",
  each: (money: string) => `${money} each`,

  history: "History",
  total: (money: string) => `Total ${money}`,
  clearHistory: "Clear",
  personPaid: (name: string) => `${name} paid`,
  splitWithList: (list: string) => `Split with ${list}`,
  everyoneLower: "everyone",
  paidBack: "Paid back",
  edit: "Edit",
  delete: "Delete",
  justNow: "just now",

  balances: "Balances",
  paidShare: (paid: string, share: string) => `Paid ${paid} · Share ${share}`,

  settleUp: "Settle up",
  paymentsLeft: (n: number) => (n === 1 ? "1 payment settles everyone" : `${n} payments settle everyone`),
  copy: "Copy",
  copied: "Copied",
  allSettled: "All settled up!",
  nobodyOwes: "Nobody owes anything.",
  markPaid: "Mark paid",

  toastUpdated: "Expense updated",
  toastAdded: (name: string, money: string, note?: string) => `${name} paid ${money}${note ? ` for ${note}` : ""}`,
  toastDeleted: "Deleted",
  toastHistoryCleared: "History cleared",
  toastRemoved: (name: string) => `Removed ${name}`,
  toastPaidBack: (from: string, to: string) => `${from} paid back ${to}`,
  toastStartedOver: "Started over",

  names: [
    "Panda", "Tiger", "Otter", "Koala", "Fox", "Owl", "Penguin", "Dolphin", "Bunny", "Bear",
    "Lion", "Kitten", "Puppy", "Hippo", "Llama", "Sloth", "Turtle", "Moose", "Zebra", "Falcon",
  ],
  friend: "Friend",
};

export type Dict = typeof en;

const vi: Dict = {
  tagline: "Chia hóa đơn, thanh toán nhanh.",
  currency: "Tiền tệ",
  language: "Ngôn ngữ",
  startOver: "Làm lại từ đầu",
  undo: "Hoàn tác",

  people: "Thành viên",
  tapToRename: "Chạm vào tên để đổi",
  addPerson: "Thêm người",
  remove: (name) => `Xóa ${name}`,

  addExpense: "Thêm khoản chi",
  editExpense: "Sửa khoản chi",
  amount: "Số tiền",
  whatFor: "Chi cho việc gì? (không bắt buộc)",
  paidBy: "Người trả",
  splitWith: "Chia cho",
  everyone: "Tất cả",
  clearSelection: "Bỏ chọn",
  save: "Lưu",
  cancel: "Hủy",
  enterAmount: "Nhập số tiền",
  pickWho: "Chọn người cùng chia",
  each: (money) => `${money} mỗi người`,

  history: "Lịch sử",
  total: (money) => `Tổng ${money}`,
  clearHistory: "Xóa hết",
  personPaid: (name) => `${name} đã trả`,
  splitWithList: (list) => `Chia cho ${list}`,
  everyoneLower: "tất cả",
  paidBack: "Đã trả lại",
  edit: "Sửa",
  delete: "Xóa",
  justNow: "vừa xong",

  balances: "Số dư",
  paidShare: (paid, share) => `Đã trả ${paid} · Phần chia ${share}`,

  settleUp: "Thanh toán",
  paymentsLeft: (n) => `${n} lần chuyển là xong`,
  copy: "Sao chép",
  copied: "Đã chép",
  allSettled: "Đã thanh toán xong!",
  nobodyOwes: "Không ai nợ ai.",
  markPaid: "Đã trả",

  toastUpdated: "Đã cập nhật khoản chi",
  toastAdded: (name, money, note) => `${name} đã trả ${money}${note ? ` cho ${note}` : ""}`,
  toastDeleted: "Đã xóa",
  toastHistoryCleared: "Đã xóa lịch sử",
  toastRemoved: (name) => `Đã xóa ${name}`,
  toastPaidBack: (from, to) => `${from} đã trả lại ${to}`,
  toastStartedOver: "Đã làm lại từ đầu",

  names: [
    "Gấu Trúc", "Hổ", "Rái Cá", "Gấu", "Cáo", "Cú", "Cánh Cụt", "Cá Heo", "Thỏ", "Sư Tử",
    "Mèo", "Cún", "Hà Mã", "Lạc Đà", "Rùa", "Ngựa Vằn", "Chim Ưng", "Sóc", "Voi", "Khỉ",
  ],
  friend: "Bạn",
};

const DICTS: Record<Lang, Dict> = { en, vi };
const STORAGE_KEY = "sharewise:lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "vi") return saved;
  } catch {}
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

type Ctx = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  return <I18nContext.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
