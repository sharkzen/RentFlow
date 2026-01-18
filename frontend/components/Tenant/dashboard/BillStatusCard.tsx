"use client";
import {
  Receipt,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  XCircle,
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
      <div className="group relative flex min-h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-emerald-500 shadow-inner ring-4 ring-white transition-transform group-hover:scale-110">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
            ไม่มียอดค้างชำระ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ขอบคุณที่ชำระค่าเช่าตรงเวลาครับ
          </p>
          <Link
            href="/tenant/bills"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600"
          >
            <Receipt size={16} />
            ดูประวัติบิล
          </Link>
        </div>
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

  const statusConfig = {
    PAID: {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-200/50",
      icon: <CheckCircle2 size={16} />,
      label: "ชำระเรียบร้อย",
      badgeStyle: "bg-white/20 text-white border-white/20",
      ring: "ring-emerald-100",
    },

    WAITING_FOR_VERIFICATION: {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500",
      shadow: "shadow-orange-200/50",
      icon: <Clock size={16} />,
      label: "รอตรวจสอบ",
      badgeStyle: "bg-white/20 text-white border-white/20",
      ring: "ring-orange-100",
    },

    OVERDUE: {
      bg: "bg-gradient-to-br from-rose-500 to-red-600",
      shadow: "shadow-red-200/50",
      icon: <AlertCircle size={16} />,
      label: "เกินกำหนด",
      badgeStyle: "bg-white/20 text-white border-white/20",
      ring: "ring-red-100",
    },

    PENDING: {
      bg: "bg-gradient-to-br from-indigo-500 to-blue-600",
      shadow: "shadow-blue-200/50",
      icon: <Wallet size={16} />,
      label: "รอชำระเงิน",
      badgeStyle: "bg-white/20 text-white border-white/20",
      ring: "ring-blue-100",
    },

    CANCELLED: {
      bg: "bg-gradient-to-br from-slate-500 to-slate-600",
      shadow: "shadow-slate-200/50",
      icon: <XCircle size={16} />,
      label: "ยกเลิกแล้ว",
      badgeStyle: "bg-white/20 text-white border-white/20",
      ring: "ring-slate-100",
    },
  };

  const config = statusConfig[bill.status] || statusConfig.PENDING;
  const isActionable = bill.status === "PENDING" || bill.status === "OVERDUE";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[2rem] p-6 text-white shadow-xl sm:p-8 ${config.bg} ${config.shadow} transition-all hover:scale-[1.01]`}
    >
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 hover:scale-110"></div>
      <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-black/10 blur-3xl"></div>
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 sm:gap-8">
        <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <div className="rounded-md bg-white/10 p-1">
                <Receipt size={14} />
              </div>
              <span>บิลเดือน {formattedMonth}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold opacity-80">฿</span>
              <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
                {formattedAmount}
              </h2>
            </div>
          </div>
          <div className="self-start">
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md transition-colors sm:px-4 sm:py-1.5 ${config.badgeStyle}`}
            >
              {config.icon}
              <span className="mt-[1px]">{config.label}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wider text-white/60 uppercase">
              กำหนดชำระ (Due Date)
            </span>
            <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
              <Calendar size={18} className="text-white/80" />
              <span>{formattedDueDate}</span>
            </div>
          </div>
          {isActionable && (
            <Link
              href={`/tenant/bills/${bill.id}`}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl active:scale-95 sm:w-auto sm:py-3"
            >
              <span className="relative z-10 flex items-center gap-2">
                ดำเนินการชำระ
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
