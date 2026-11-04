const SYMBOLS: Record<string, string> = { EUR: "€", ZAR: "R", USD: "$" };

export function formatMoney(amount: number, currency = "EUR") {
  const symbol = SYMBOLS[currency] ?? currency + " ";
  return `${symbol}${amount.toFixed(2)}`;
}