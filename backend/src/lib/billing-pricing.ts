import { CouponType } from "@prisma/client";

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** เพิ่มเดือนแบบปฏิทิน และไม่ให้วันล้นเดือน (31 ม.ค. + 1 เดือน = 28/29 ก.พ.) */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(day, lastDay));
  return result;
}

/** ส่วนลดไม่เกินราคาเต็ม และไม่ติดลบ */
export function computeDiscount(
  coupon: { type: CouponType; value: number } | null,
  baseAmount: number,
): number {
  if (!coupon || baseAmount <= 0) return 0;

  const raw =
    coupon.type === "PERCENT"
      ? (baseAmount * Math.min(coupon.value, 100)) / 100
      : coupon.value;

  return round2(Math.min(Math.max(raw, 0), baseAmount));
}

/** period ของโควต้าสลิป ใช้เวลาไทย เพื่อให้รอบเดือนตรงกับที่เจ้าของหอเข้าใจ */
export function currentPeriod(now = new Date()): string {
  const th = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return `${th.getUTCFullYear()}-${String(th.getUTCMonth() + 1).padStart(2, "0")}`;
}
