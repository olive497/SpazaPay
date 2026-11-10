// Rands per 1 EUR. The Interledger test wallet is in EUR, so the app converts.
// Check the current EUR/ZAR rate before the demo and update this number.
export const ZAR_PER_EUR = 20

// Backend base URL. Set VITE_API_BASE when deploying; falls back to local.
export const API_BASE: string =
  ((import.meta as any).env?.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080/api"

export const TOKEN_KEY = "spazapay_token"
export const LANG_KEY = "spazapay_lang"
export const WALLET_BASE = "https://ilp.interledger-test.dev/"
