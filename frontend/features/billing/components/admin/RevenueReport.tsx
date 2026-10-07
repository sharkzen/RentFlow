"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { routes } from "@/config/routes";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { RevenueReport as Report } from "../../types";

const baht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;

const monthLabel = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
      <p className="text-muted text-sm">{label}</p>
      <p className="text-foreground mt-1 text-2xl font-bold">{value}</p>
      {hint && <div className="text-muted mt-1 text-xs">{hint}</div>}
    </div>
  );
}

export default function RevenueReport() {
  const [months, setMonths] = useState(12);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    AdminBillingService.getReport(months)
      .then((data) => !cancelled && setReport(data))
      .catch((error) =>
        toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดรายงานได้")),
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [months]);

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!report) return null;

  const { totals, monthly, subscriptions, promotions } = report;
  const max = Math.max(1, ...monthly.map((m) => m.total));

  const diff = totals.thisMonth - totals.lastMonth;
  const diffPct =
    totals.lastMonth > 0 ? Math.round((diff / totals.lastMonth) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              รายงานรายได้
            </h1>
            <p className="text-muted mt-1 text-sm">
              นับเฉพาะคำสั่งซื้อที่ชำระและอนุมัติแล้ว
            </p>
          </div>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="border-border bg-surface text-foreground rounded-xl border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          aria-label="ช่วงเวลา"
        >
          <option value={6}>6 เดือนล่าสุด</option>
          <option value={12}>12 เดือนล่าสุด</option>
          <option value={24}>24 เดือนล่าสุด</option>
        </select>
      </div>

      {report.pendingReview > 0 && (
        <Link
          href={routes.admin.billingOrders}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 transition-colors hover:bg-blue-100"
        >
          มี {report.pendingReview} คำสั่งซื้อรอตรวจสอบสลิป — ไปที่หน้าตรวจสอบ
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="รายได้เดือนนี้"
          value={baht(totals.thisMonth)}
          hint={
            diffPct === null ? (
              "ยังไม่มีข้อมูลเดือนก่อน"
            ) : (
              <span
                className={`inline-flex items-center gap-1 ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {diff >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {diff >= 0 ? "+" : ""}
                {diffPct}% จากเดือนก่อน ({baht(totals.lastMonth)})
              </span>
            )
          }
        />
        <Stat
          label="รายได้ประจำเดือนโดยประมาณ (MRR)"
          value={baht(subscriptions.mrr)}
          hint={`จากแพ็คเกจที่ชำระและยังไม่หมดอายุ ${subscriptions.active} ราย`}
        />
        <Stat
          label="รายได้สะสมทั้งหมด"
          value={baht(totals.allTime)}
          hint={`${totals.paidOrders.toLocaleString("th-TH")} คำสั่งซื้อ · ให้ส่วนลดไปแล้ว ${baht(totals.discountGiven)}`}
        />
        <Stat
          label="โปรโมทหอที่กำลังแสดง"
          value={`${promotions.active} / ${promotions.maxSlots}`}
          hint="ช่องที่ใช้อยู่ต่อช่องทั้งหมด"
        />
      </div>

      <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-foreground text-lg font-bold">รายได้รายเดือน</h2>
          <div className="text-muted flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
              แพ็คเกจ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              โปรโมทหอ
            </span>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {monthly.map((m) => (
            <li key={m.period} className="flex items-center gap-3 text-sm">
              <span className="text-muted w-14 shrink-0">
                {monthLabel(m.period)}
              </span>
              <div
                className="bg-background flex h-6 flex-1 overflow-hidden rounded-md"
                role="img"
                aria-label={`${monthLabel(m.period)} แพ็คเกจ ${baht(m.plan)} โปรโมท ${baht(m.promotion)}`}
              >
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${(m.plan / max) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(m.promotion / max) * 100}%` }}
                />
              </div>
              <span className="text-foreground w-24 shrink-0 text-right font-medium">
                {baht(m.total)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground text-lg font-bold">
            สถานะแพ็คเกจของเจ้าของหอ
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["ชำระแล้ว ใช้งานอยู่", subscriptions.active],
              ["ทดลองใช้ฟรี", subscriptions.trial],
              ["หมดอายุ (ผ่อนผัน)", subscriptions.grace],
              ["หมดอายุแล้ว", subscriptions.expired],
            ].map(([label, count]) => (
              <div
                key={label as string}
                className="border-border bg-background rounded-xl border p-3"
              >
                <dt className="text-muted text-xs">{label}</dt>
                <dd className="text-foreground mt-0.5 text-xl font-bold">
                  {count as number}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground text-lg font-bold">
            ผู้ใช้แยกตามแพ็คเกจ (ชำระแล้ว)
          </h2>
          {subscriptions.byPlan.length === 0 ? (
            <p className="text-muted mt-4 text-sm">ยังไม่มีผู้ชำระแพ็คเกจ</p>
          ) : (
            <ul className="divide-border mt-4 divide-y text-sm">
              {subscriptions.byPlan.map((p) => (
                <li
                  key={p.planId}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-foreground font-medium">{p.name}</span>
                  <span className="text-muted">
                    {p.count} ราย · {baht(p.price * p.count)}/เดือน
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
