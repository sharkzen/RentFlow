"use client";
import { Zap, Droplets } from "lucide-react";
import { TenantDashboardData } from "@/features/tenant";

interface Props {
  utilities: TenantDashboardData["utilities"] | undefined | null;
}

export default function UtilityUsageCard({ utilities }: Props) {
  if (!utilities) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-yellow-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-inner">
            <Zap size={24} strokeWidth={2.5} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              มิเตอร์ล่าสุด
            </p>
            <p className="font-mono text-sm font-semibold text-slate-600">
              {utilities.electric.currentUnit}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">ไฟฟ้า</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-800">
              {utilities.electric.used}
            </h4>
            <span className="text-xs text-slate-400">หน่วย</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-yellow-400"
              style={{
                width: "60%",
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
            <Droplets size={24} strokeWidth={2.5} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              มิเตอร์ล่าสุด
            </p>
            <p className="font-mono text-sm font-semibold text-slate-600">
              {utilities.water.currentUnit}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">น้ำประปา</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-800">
              {utilities.water.used}
            </h4>
            <span className="text-xs text-slate-400">หน่วย</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-400"
              style={{
                width: "40%",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
