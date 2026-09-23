"use client";
import { Receipt, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TenantDashboardData } from "@/features/tenant";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Props {
  bill: TenantDashboardData["bill"] | undefined | null;
}

export default function BillSummaryCard({ bill }: Props) {
  if (!bill) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-100 dark:shadow-none">
        <CheckCircle2 size={48} className="mb-3 opacity-90" />
        <h2 className="text-xl font-bold">ไม่มียอดค้างชำระ</h2>
        <p className="text-sm text-emerald-100">ขอบคุณที่ชำระเงินตรงเวลาครับ</p>
        <Link
          href="/tenant/bills"
          className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30"
        >
          ดูประวัติการชำระ
        </Link>
      </div>
    );
  }

  const formattedAmount = bill.amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedMonth = format(new Date(bill.billingMonth), "MMMM yyyy", {
    locale: th,
  });

  const formattedDueDate = format(new Date(bill.dueDate), "d MMM yyyy", {
    locale: th,
  });

  const isOverdue = bill.status === "OVERDUE";
  const bgClass = isOverdue
    ? "from-red-600 to-orange-600 shadow-red-200 dark:shadow-none"
    : "from-indigo-600 to-violet-600 shadow-indigo-200 dark:shadow-none";

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${bgClass} p-6 text-white shadow-lg transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Receipt size={16} />
            บิลประจำเดือน {formattedMonth}
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            ฿{formattedAmount}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${isOverdue ? "bg-red-800/30 text-red-100" : "bg-white/20 text-white"}`}
        >
          {isOverdue ? "เกินกำหนด" : "รอชำระเงิน"}
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Calendar size={16} />
          <span>กำหนดชำระ: {formattedDueDate}</span>
        </div>
        <Link
          href={`/tenant/bills/${bill.id}`}
          className="group flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50"
        >
          ชำระเงิน
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
}
