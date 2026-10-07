import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Gift, Megaphone, X } from "lucide-react";
import { planPeriodPrice, planSavings } from "@/features/billing/lib/pricing";

export const metadata: Metadata = {
  title: "ราคาแพ็คเกจ",
  description:
    "ลงประกาศหอพักฟรี และเลือกแพ็คเกจระบบจัดการหอพัก RentFlow ที่เหมาะกับจำนวนหอและห้องของคุณ พร้อมบริการโปรโมทหอพัก",
};

const API_URL = process.env.API_URL || "http://localhost:3001";

interface PricingPlan {
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

interface Pricing {
  plans: PricingPlan[];
  promotion: { pricePerMonth: number; maxSlots: number };
  trial: { planName: string; days: number } | null;
}

async function getPricing(): Promise<Pricing | null> {
  try {
    const res = await fetch(`${API_URL}/api/billing/public/pricing`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    return (await res.json()).data as Pricing;
  } catch {
    return null;
  }
}

const baht = (n: number) => n.toLocaleString("th-TH");

export default async function PricingPage() {
  const pricing = await getPricing();

  return (
    <main className="bg-grid bg-background min-h-screen w-full px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-foreground text-3xl font-bold sm:text-4xl">
            ราคาแพ็คเกจ
          </h1>
          <p className="text-muted mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            ลงประกาศหอพักให้คนค้นหาเจอได้ฟรี
            และเลือกแพ็คเกจเมื่อต้องการระบบจัดการผู้เช่า ออกบิล และตรวจสลิปอัตโนมัติ
          </p>
        </header>

        {!pricing ? (
          <p className="text-muted mt-16 text-center text-sm">
            ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้ กรุณาลองใหม่ภายหลัง
          </p>
        ) : (
          <>
            {pricing.trial && (
              <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
                <Gift size={20} className="shrink-0" />
                <span>
                  สมัครใหม่ทดลองใช้แพ็คเกจ {pricing.trial.planName} ฟรี{" "}
                  {pricing.trial.days} วัน ไม่ต้องผูกบัตร
                </span>
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {pricing.plans.map((plan) => (
                <section
                  key={plan.id}
                  className="border-border bg-surface flex flex-col rounded-2xl border p-6 shadow-sm"
                >
                  <h2 className="text-foreground text-lg font-bold">
                    {plan.name}
                  </h2>
                  {plan.description && (
                    <p className="text-muted mt-1 text-sm">{plan.description}</p>
                  )}
                  <p className="text-foreground mt-5 text-3xl font-bold">
                    ฿{baht(plan.priceMonthly)}
                    <span className="text-muted text-sm font-normal">
                      {" "}
                      / เดือน
                    </span>
                  </p>
                  <ul className="text-muted mt-5 flex-1 space-y-2.5 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {baht(plan.maxDorms)} หอพัก
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {baht(plan.maxRooms)} ห้องพักรวม
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {plan.slipUnlimited
                        ? "ตรวจสลิปอัตโนมัติไม่จำกัด"
                        : `ตรวจสลิปอัตโนมัติ ${baht(plan.slipQuotaMonthly)} ครั้ง/เดือน`}
                    </li>
                    <li
                      className={`flex items-center gap-2 ${plan.hasOcr ? "" : "opacity-50"}`}
                    >
                      {plan.hasOcr ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <X size={16} />
                      )}
                      สแกนมิเตอร์น้ำ/ไฟด้วย OCR
                    </li>
                  </ul>
                  {planSavings(plan, 12) > 0 && (
                    <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      รายปี ฿{baht(planPeriodPrice(plan, 12))} (เฉลี่ย ฿
                      {baht(Math.round(planPeriodPrice(plan, 12) / 12))}/เดือน) ประหยัด ฿
                      {baht(planSavings(plan, 12))}
                    </p>
                  )}
                  <Link
                    href="/auth/register"
                    className="mt-6 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                  >
                    เริ่มใช้งาน
                  </Link>
                </section>
              ))}
            </div>

            <section className="border-border bg-surface mx-auto mt-10 flex max-w-3xl flex-col items-start gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Megaphone size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-foreground text-lg font-bold">
                  โปรโมทหอพัก ฿{baht(pricing.promotion.pricePerMonth)} / เดือน
                </h2>
                <p className="text-muted mt-1 text-sm">
                  แสดงหอพักของคุณก่อนหอทั่วไปในหน้าแรกและผลการค้นหา จำกัดสูงสุด{" "}
                  {pricing.promotion.maxSlots} หอพร้อมกัน ใครชำระก่อนแสดงก่อน
                  ไม่ต้องใช้แพ็คเกจจัดการก็ซื้อได้
                </p>
              </div>
            </section>

            <p className="text-muted mt-10 text-center text-xs">
              ชำระผ่านการโอน PromptPay ระบบตรวจสลิปและเปิดใช้งานอัตโนมัติ
              ราคาและเงื่อนไขอาจมีการเปลี่ยนแปลง
            </p>
          </>
        )}
      </div>
    </main>
  );
}
