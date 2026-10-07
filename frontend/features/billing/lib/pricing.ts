import type { Plan } from "../types";

/** ระยะเวลาที่ขายได้ (เดือน) ต้องตรงกับ ALLOWED_MONTHS ฝั่ง backend */
export const MONTH_OPTIONS = [1, 3, 6, 12] as const;

export const MONTH_LABEL: Record<number, string> = {
  1: "1 เดือน",
  3: "3 เดือน",
  6: "6 เดือน",
  12: "รายปี",
};

type Pricing = Pick<
  Plan,
  "priceMonthly" | "discountPct3m" | "discountPct6m" | "discountPct12m"
>;

export function durationDiscountPct(plan: Pricing, months: number) {
  if (months >= 12) return plan.discountPct12m;
  if (months >= 6) return plan.discountPct6m;
  if (months >= 3) return plan.discountPct3m;
  return 0;
}

/** ต้องคำนวณเหมือน planPeriodPrice ฝั่ง backend (ปัดเป็นบาทเต็ม) */
export function planPeriodPrice(plan: Pricing, months: number) {
  const pct = Math.min(Math.max(durationDiscountPct(plan, months), 0), 100);
  return Math.round(plan.priceMonthly * months * (1 - pct / 100));
}

/** ประหยัดได้เท่าไรเมื่อเทียบกับจ่ายรายเดือน */
export function planSavings(plan: Pricing, months: number) {
  return Math.max(0, Math.round(plan.priceMonthly * months) - planPeriodPrice(plan, months));
}
