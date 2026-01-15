"use client";
import { Wrench, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { TenantDashboardData } from "@/features/tenant";

interface Props {
  maintenance: TenantDashboardData["maintenance"] | undefined;
}

export default function QuickStatsCard({ maintenance }: Props) {
  const activeCount = maintenance?.totalActive || 0;

  return (
    <Link
      href="/tenant/maintenance"
      className="group relative flex items-center justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg"
    >
      <div className="relative z-10 flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${activeCount > 0 ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}
        >
          <Wrench size={26} strokeWidth={2.5} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800">แจ้งซ่อม</h4>
          {activeCount > 0 ? (
            <p className="flex items-center gap-1 text-sm font-medium text-indigo-600">
              <AlertCircle size={14} />
              กำลังดำเนินการ {activeCount}รายการ
            </p>
          ) : (
            <p className="text-sm text-slate-500">ไม่มีรายการค้าง</p>
          )}
        </div>
      </div>
      <div className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
        <ChevronRight size={20} />
      </div>

      <div className="absolute top-0 right-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-indigo-500/5 blur-2xl transition-colors group-hover:bg-indigo-500/10"></div>
    </Link>
  );
}
