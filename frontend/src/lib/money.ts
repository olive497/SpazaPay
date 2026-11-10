import { ZAR_PER_EUR } from "./config"

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const zarToEur = (zar: number) => round2(zar / ZAR_PER_EUR)

export const eurToZar = (eur: number) => round2(eur * ZAR_PER_EUR)

export const formatZar = (amount: number | string) => {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return `R${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`
}