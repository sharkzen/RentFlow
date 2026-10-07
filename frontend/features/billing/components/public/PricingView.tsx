"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Check, Gift, Megaphone, Minus, X } from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import DurationSwitch from "../shared/DurationSwitch";
import PlanPriceBlock, { periodUnit } from "../shared/PlanPriceBlock";
import { planPeriodPrice, planSavings } from "../../lib/pricing";

export interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxDorms: number;
  maxRooms: number;
  slipQuotaMonthly: number;
  slipUnlimited: boolean;
  hasOcr: boolean;
  discountPct3m: number;
  discountPct6m: number;
  discountPct12m: number;
}

export interface Pricing {
  plans: PricingPlan[];
  promotion: { pricePerMonth: number; maxSlots: number };
  trial: { planName: string; days: number } | null;
}

const fmt = (n: number) => n.toLocaleString("th-TH");

const slipText = (p: PricingPlan) =>
  p.slipUnlimited ? "ไม่จำกัด" : `${fmt(p.slipQuotaMonthly)} ครั้ง/เดือน`;

function FeatureRow({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`flex min-h-7 items-center gap-2.5 text-sm ${ok ? "text-foreground" : "text-muted/60"}`}
    >
      {ok ? (
        <Check
          size={16}
          className="shrink-0 rounded-full bg-emerald-500 p-0.5 text-white"
        />
      ) : (
        <X size={16} className="shrink-0" />
      )}
      <span className={ok ? "" : "line-through decoration-1"}>{children}</span>
    </li>
  );
}

export default function PricingView({ pricing }: { pricing: Pricing }) {
  // ตั้งต้นที่รายปี (คุ้มสุด) ตามที่ต้องการให้เจ้าของหอเห็นราคาที่ประหยัดที่สุดก่อน
  const [months, setMonths] = useState(12);
  const { plans } = pricing;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-foreground text-3xl font-bold sm:text-4xl">
            ราคาแพ็คเกจ
          </h1>
          <p className="text-muted mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            ลงประกาศหอพักให้คนค้นหาเจอได้ฟรี
            และเลือกแพ็คเกจเมื่อต้องการระบบจัดการผู้เช่า ออกบิล
            และตรวจสลิปอัตโนมัติ
          </p>
        </header>

        <section className="border-border bg-surface mx-auto mt-10 max-w-3xl rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-foreground text-lg font-bold">
                ลงประกาศหอพัก ฟรีตลอด
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <FeatureRow ok>
                  ลงประกาศได้ทุกหอ ไม่มีค่าใช้จ่ายรายเดือน
                </FeatureRow>
                <FeatureRow ok>
                  ตั้งค่ารายละเอียดหอ ราคา ค่าน้ำ-ค่าไฟ และรูปภาพได้เต็มที่
                </FeatureRow>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="rounded-xl border border-blue-600 px-5 py-2.5 text-center text-sm font-medium whitespace-nowrap text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              สมัครลงประกาศฟรี
            </Link>
          </div>
          <p className="text-muted border-border mt-4 border-t pt-3 text-xs">
            แพ็คเกจด้านล่างสำหรับเครื่องมือจัดการหอพัก ได้แก่ ผู้เช่า ออกบิล
            ตรวจสลิป แจ้งซ่อม และตั้งค่าการเงินของหอ
          </p>
        </section>

        {pricing.trial && (
          <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            <Gift size={20} className="shrink-0" />
            <span>
              สมัครใหม่ทดลองใช้แพ็คเกจ {pricing.trial.planName} ฟรี{" "}
              {pricing.trial.days} วัน 
            </span>
          </div>
        )}

        <div className="mt-12">
          <DurationSwitch
            value={months}
            onChange={setMonths}
            plans={plans}
            id="pricing"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.section
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="border-border bg-surface flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <h2 className="text-foreground text-xl font-bold">{plan.name}</h2>
              <p className="text-muted mt-1 line-clamp-2 min-h-10 text-sm">
                {plan.description}
              </p>

              <div className="mt-4">
                <PlanPriceBlock plan={plan} months={months} />
              </div>

              <Link
                href="/auth/register"
                className="mt-2 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                เริ่มใช้งาน
              </Link>

              <ul className="border-border mt-6 space-y-1.5 border-t pt-5">
                <FeatureRow ok>{fmt(plan.maxDorms)} หอพัก</FeatureRow>
                <FeatureRow ok>{fmt(plan.maxRooms)} ห้องพักรวม</FeatureRow>
                <FeatureRow ok>
                  ตรวจสลิป {plan.slipUnlimited ? "ไม่จำกัด" : slipText(plan)}
                </FeatureRow>
                <FeatureRow ok={plan.hasOcr}>สแกนมิเตอร์ OCR</FeatureRow>
              </ul>
            </motion.section>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-foreground text-center text-2xl font-bold">
            เปรียบเทียบแพ็คเกจ
          </h2>
          <p className="text-muted mt-1 text-center text-sm">
            ราคาตามระยะเวลาที่เลือก: {periodUnit(months)}
          </p>

          <div className="border-border bg-surface mt-6 overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-border bg-background border-b">
                  <th
                    scope="col"
                    className="text-muted bg-background sticky left-0 px-5 py-4 text-left font-medium"
                  >
                    รายการ
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className="text-foreground px-4 py-4 text-center text-base font-bold"
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                <CompareRow label="ราคาเฉลี่ยต่อเดือน" strong>
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      ฿{fmt(Math.round(planPeriodPrice(p, months) / months))}
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label={`ยอดชำระ (${periodUnit(months)})`}>
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      ฿{fmt(planPeriodPrice(p, months))}
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label="ประหยัดเมื่อเทียบรายเดือน">
                  {plans.map((p) => {
                    const s = planSavings(p, months);
                    return (
                      <td
                        key={p.id}
                        className={`px-4 py-3.5 text-center ${s > 0 ? "font-semibold text-emerald-600" : "text-muted"}`}
                      >
                        {s > 0 ? (
                          `฿${fmt(s)}`
                        ) : (
                          <Minus size={16} className="mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </CompareRow>
                <CompareRow label="จำนวนหอพัก">
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      {fmt(p.maxDorms)}
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label="จำนวนห้องพักรวม">
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      {fmt(p.maxRooms)}
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label="ตรวจสลิปอัตโนมัติ">
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      {slipText(p)}
                    </td>
                  ))}
                </CompareRow>
                <CompareRow label="สแกนมิเตอร์น้ำ/ไฟด้วย OCR">
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3.5 text-center">
                      {p.hasOcr ? (
                        <Check
                          size={18}
                          className="mx-auto rounded-full bg-emerald-500 p-0.5 text-white"
                          aria-label="มี"
                        />
                      ) : (
                        <X
                          size={18}
                          className="text-muted/60 mx-auto"
                          aria-label="ไม่มี"
                        />
                      )}
                    </td>
                  ))}
                </CompareRow>
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-border bg-surface mx-auto mt-12 flex max-w-3xl flex-col items-start gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Megaphone size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-foreground text-lg font-bold">
              โปรโมทหอพัก ฿{fmt(pricing.promotion.pricePerMonth)} / เดือน
            </h2>
            <p className="text-muted mt-1 text-sm">
              แสดงหอพักของคุณก่อนหอทั่วไปในหน้าแรกและผลการค้นหา จำกัดสูงสุด{" "}
              {pricing.promotion.maxSlots} หอพร้อมกัน ใครชำระก่อนแสดงก่อน
              ไม่ต้องใช้แพ็คเกจจัดการก็ซื้อได้
            </p>
          </div>
        </section>

        <p className="text-muted mt-10 text-center text-xs">
          ชำระผ่านการโอนเงิน ระบบตรวจสลิปและเปิดใช้งานอัตโนมัติ
          ราคาและเงื่อนไขอาจมีการเปลี่ยนแปลง
        </p>
      </div>
    </MotionConfig>
  );
}

function CompareRow({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={strong ? "text-foreground font-semibold" : "text-foreground"}
    >
      <th
        scope="row"
        className={`bg-surface sticky left-0 px-5 py-3.5 text-left ${strong ? "text-foreground font-semibold" : "text-muted font-medium"}`}
      >
        {label}
      </th>
      {children}
    </tr>
  );
}
