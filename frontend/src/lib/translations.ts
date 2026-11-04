export type Lang = "en" | "zu" | "af" | "st";

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    accept: "Accept",
    sales: "Sales",
    history: "History",
    settings: "Settings",
    paid: "Paid",
    pending: "Pending",
    expired: "Expired",
    waiting: "Waiting for payment...",
    walletNotFound: "Wallet address not found",
    offline: "No connection. Try again.",
  },
  zu: { /* have a isiZulu speaker fill these in */ },
  af: { /* Afrikaans */ },
  st: { /* Sesotho */ },
};

export const t = (lang: Lang, key: string) =>
  translations[lang][key] ?? translations.en[key] ?? key;