"use client";
import React from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  MONTH_LABEL,
  MONTH_OPTIONS,
  durationDiscountPct,
} from "../../lib/pricing";
import type { Plan } from "../../types";

export type PricedPlan = Pick<
  Plan,
  "priceMonthly" | "discountPct3m" | "discountPct6m" | "discountPct12m"
>;

const trim = (n: number) => String(Number(n.toFixed(1)));

/** ข้อความใต้ปุ่ม เช่น "ราคาปกติ", "ลด 17%" (ถ้าแต่ละแพ็คลดไม่เท่ากันจะขึ้น "ลดสูงสุด") */
export function discountCaption(plans: PricedPlan[], months: number) {
  if (months === 1) return "ราคาปกติ";

  const pcts = plans.map((p) => durationDiscountPct(p, months));
  const max = Math.max(0, ...pcts);
  const min = Math.min(max, ...pcts);

  if (max <= 0) return "ไม่มีส่วนลด";

  return min === max ? `ลด ${trim(max)}%` : `ลดสูงสุด ${trim(max)}%`;
}

/**
 * แถบเลือกระยะเวลา 1 / 3 / 6 เดือน / รายปี พร้อมแถบสีที่เลื่อนตามปุ่มที่เลือก
 * ใช้ร่วมกันทั้งหน้า /pricing และหน้าเลือกแพ็คเกจของเจ้าของหอ
 */
export default function DurationSwitch({
  value,
  onChange,
  plans,
  id = "duration",
}: {
  value: number;
  onChange: (months: number) => void;
  plans: PricedPlan[];
  /** ต้องไม่ซ้ำกันถ้าใช้หลายอันในหน้าเดียว (ใช้กับ layoutId ของ animation) */
  id?: string;
}) {
  const annualSaves = plans.some((p) => p.discountPct12m > 0);

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="group"
        aria-label="เลือกระยะเวลาที่ต้องการชำระ"
        className="border-border bg-surface mx-auto grid w-full max-w-3xl grid-cols-2 gap-1.5 rounded-2xl border p-1.5 shadow-sm sm:grid-cols-4"
      >
        {MONTH_OPTIONS.map((m) => {
          const active = value === m;

          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(m)}
              className="relative cursor-pointer rounded-xl px-3 py-3 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {active && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-xl bg-blue-600 shadow-md"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {m === 12 && annualSaves && (
                <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  คุ้มสุด
                </span>
              )}
              <span
                className={`relative z-10 block text-sm font-semibold ${active ? "text-white" : "text-foreground"}`}
              >
                {MONTH_LABEL[m]}
              </span>
              <span
                className={`relative z-10 block text-xs ${active ? "text-white/85" : "text-muted"}`}
              >
                {discountCaption(plans, m)}
              </span>
            </button>
          );
        })}
      </div>
    </MotionConfig>
  );
}
