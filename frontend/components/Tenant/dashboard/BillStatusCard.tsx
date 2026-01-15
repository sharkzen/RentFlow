"use client";
import {
  Receipt,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { TenantDashboardData } from "@/features/tenant";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Props {
  bill: TenantDashboardData["bill"] | undefined | null;
}

export default function BillStatusCard({ bill }: Props) {
  if (!bill) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-8 text-center transition-all hover:border-indigo-200 hover:bg-white">
        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-700">ไม่มียอดค้างชำระ</h2>
        <p className="text-slate-500">ขอบคุณที่ชำระค่าเช่าตรงเวลาครับ</p>
        <Link
          href="/tenant/bills"
          className="mt-6 rounded-full bg-white px-6 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md"
        >
          ดูประวัติบิล
        </Link>
      </div>
    );
  }

  const formattedAmount = bill.amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
  });

  const formattedMonth = format(new Date(bill.billingMonth), "MMMM yyyy", {
    locale: th,
  });

  const formattedDueDate = format(new Date(bill.dueDate), "d MMM yyyy", {
    locale: th,
  });

  const statusConfig = {
    PAID: {
      bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-700",
      shadow: "shadow-emerald-200",
      icon: <CheckCircle2 size={18} />,
      label: "ชำระเรียบร้อย",
      badgeColor: "bg-emerald-400/30 text-emerald-50 border-emerald-400/20",
    },

    WAITING_FOR_VERIFICATION: {
      bg: "bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600",
      shadow: "shadow-orange-200",
      icon: <Clock size={18} />,
      label: "รอตรวจสอบยอด",
      badgeColor: "bg-orange-400/30 text-orange-50 border-orange-400/20",
    },

    OVERDUE: {
      bg: "bg-gradient-to-br from-rose-500 via-red-600 to-red-700",
      shadow: "shadow-red-200",
      icon: <AlertCircle size={18} />,
      label: "เกินกำหนดชำระ",
      badgeColor: "bg-red-400/30 text-red-50 border-red-400/20",
    },

    PENDING: {
      bg: "bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700",
      shadow: "shadow-blue-200",
      icon: <Receipt size={18} />,
      label: "รอชำระเงิน",
      badgeColor: "bg-blue-400/30 text-blue-50 border-blue-400/20",
    },
  };

  const config = statusConfig[bill.status] || statusConfig.PENDING;
  const isActionable = bill.status === "PENDING" || bill.status === "OVERDUE";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl ${config.bg} ${config.shadow} transition-transform duration-300 hover:scale-[1.01]`}
    >
      <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/5 blur-2xl"></div>
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-white/90">
              <Receipt size={16} />
              บิลประจำเดือน {formattedMonth}
            </p>
            <h2 className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
              ฿{formattedAmount}
            </h2>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold backdrop-blur-md ${config.badgeColor}`}
          >
            {config.icon} {config.label}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
              กำหนดชำระ
            </span>
            <div className="flex items-center gap-2 text-base font-semibold">
              <Calendar size={18} className="text-white/80" />
              {formattedDueDate}
            </div>
          </div>
          {isActionable && (
            <Link
              href={`/tenant/bills/${bill.id}`}
              className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl active:scale-95"
            >
              ดำเนินการชำระ
              <ArrowRight
                size={18}
                className="text-indigo-600 transition-transform group-hover:translate-x-1"
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
