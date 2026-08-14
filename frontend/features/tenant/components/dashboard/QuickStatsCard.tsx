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
      className={`group bg-surface hover:bg-background relative flex items-center justify-between overflow-hidden rounded-3xl border transition-all duration-300 ${hasActive ? "border-indigo-200 hover:border-indigo-300" : "border-border hover:border-muted"}`}
    >
      <div
        className={`absolute -top-6 -right-6 h-32 w-32 rounded-full blur-3xl transition-opacity ${hasActive ? "bg-indigo-50 opacity-100" : "bg-emerald-50 opacity-0"}`}
      ></div>
      <div className="relative z-10 flex items-center gap-5 p-6">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors ${hasActive ? "border-indigo-100 bg-indigo-50 text-indigo-600" : "border-border bg-background text-muted"}`}
        >
          <Wrench size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-foreground text-lg font-bold">แจ้งซ่อม</h4>
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
              <p className="text-muted text-sm font-medium">
                ไม่พบรายการแจ้งซ่อม
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="pr-6">
        <div className="border-border bg-surface text-muted group-hover:border-border group-hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full border transition-all">
          <ChevronRight
            size={20}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
