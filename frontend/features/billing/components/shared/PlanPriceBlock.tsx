"use client";
import React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { planPeriodPrice, planSavings } from "../../lib/pricing";
import type { PricedPlan } from "./DurationSwitch";

const fmt = (n: number) => n.toLocaleString("th-TH");

export const periodUnit = (months: number) =>
  months === 12 ? "1 ปี" : `${months} เดือน`;

/**
 * ราคาในการ์ดแพ็คเกจ: ใช้ความสูงคงที่และโครงสร้างเดียวกันทุกการ์ด
 * ตัวเลขทุกใบจึงอยู่แนวเดียวกัน และไม่กระตุกเมื่อสลับระยะเวลา
 */
export default function PlanPriceBlock({
  plan,
  months,
}: {
  plan: PricedPlan;
  months: number;
}) {
  const total = planPeriodPrice(plan, months);
  const perMonth = Math.round(total / months);
  const saving = planSavings(plan, months);

  return (
    // reducedMotion="user": ผู้ใช้ที่ปิดการเคลื่อนไหวในระบบจะไม่เห็นการเลื่อน (เหลือแค่จาง)
    // โดยไม่เปลี่ยน HTML ที่ render จึงไม่เกิด hydration mismatch
    <MotionConfig reducedMotion="user">
      <div className="h-[138px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={months}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            <div className="h-5 text-sm">
              {saving > 0 && (
                <span className="text-muted line-through">
                  ฿{fmt(plan.priceMonthly)}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground text-4xl font-bold tabular-nums">
                ฿{fmt(perMonth)}
              </span>
              <span className="text-muted text-sm">/ เดือน</span>
            </div>
            <p className="text-muted mt-2 h-5 text-sm">
              {months === 1
                ? "ชำระเป็นรายเดือน"
                : `ชำระครั้งเดียว ฿${fmt(total)} / ${periodUnit(months)}`}
            </p>
            <div className="mt-2 h-7">
              {saving > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  ประหยัด ฿{fmt(saving)}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
