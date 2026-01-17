"use client";
import { Wrench, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TenantDashboardData } from "@/features/tenant";

interface Props {
  maintenance: TenantDashboardData["maintenance"] | undefined;
}

export default function QuickStatsCard({ maintenance }: Props) {
  const activeCount = maintenance?.totalActive || 0;
  const hasActive = activeCount > 0;

  return (
    <Link
      href="/tenant/maintenance"
      className={`group relative flex items-center justify-between overflow-hidden rounded-3xl border transition-all duration-300 hover:bg-slate-50 ${hasActive ? "border-indigo-200 bg-white hover:border-indigo-300" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <div
        className={`absolute -top-6 -right-6 h-32 w-32 rounded-full blur-3xl transition-opacity ${hasActive ? "bg-indigo-50 opacity-100" : "bg-emerald-50 opacity-0"}`}
      ></div>
      <div className="relative z-10 flex items-center gap-5 p-6">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors ${hasActive ? "border-indigo-100 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-400"}`}
        >
          <Wrench size={24} strokeWidth={2.5} />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-bold text-slate-800">แจ้งซ่อม</h4>
          {hasActive ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              <p className="text-sm font-semibold text-indigo-600">
                กำลังดำเนินการ {activeCount}รายการ
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-sm font-medium text-slate-500">
                ไม่พบรายการแจ้งซ่อม
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pr-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 transition-all group-hover:border-slate-200 group-hover:text-slate-600">
          <ChevronRight
            size={20}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
