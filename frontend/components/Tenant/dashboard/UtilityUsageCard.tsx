"use client";
import { useState } from "react";
import {
  Zap,
  Droplets,
  ArrowRight,
  History,
  Image as ImageIcon,
  CameraOff,
  X,
} from "lucide-react";
import { TenantDashboardData } from "@/features/tenant";

interface Props {
  utilities: TenantDashboardData["utilities"] | undefined | null;
}

export default function UtilityUsageCard({ utilities }: Props) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!utilities) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-lg sm:p-6">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-14 sm:w-14">
                  <Zap
                    size={24}
                    strokeWidth={2}
                    fill="currentColor"
                    className="opacity-100"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                    ค่าไฟฟ้า
                  </h3>
                  <p className="text-xs font-medium text-slate-400 sm:text-sm">
                    Electricity
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                  ยอดการใช้
                </span>
                <div className="flex items-baseline justify-end gap-1 text-amber-600">
                  <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {utilities.electric.used}
                  </span>
                  <span className="text-xs font-semibold text-amber-600/70 sm:text-sm">
                    หน่วย
                  </span>
                </div>
              </div>
            </div>
            <div className="my-5 h-px w-full bg-slate-100"></div>

            <div className="mb-4">
              {utilities.electric.imageUrl ? (
                <button
                  onClick={() => setPreviewImage(utilities.electric.imageUrl)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:text-amber-800"
                >
                  <ImageIcon size={18} />
                  ดูรูปมิเตอร์ไฟ
                </button>
              ) : (
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-400"
                >
                  <CameraOff size={18} />
                  ไม่มีรูปภาพ
                </button>
              )}
            </div>
          </div>
          <div className="mt-auto rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
              <History size={14} />
              <span>เปรียบเทียบมิเตอร์ (Meter Reading)</span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="truncate text-[10px] text-slate-400 sm:text-xs">
                  ครั้งก่อน
                </span>
                <span className="truncate text-base font-medium text-slate-600 sm:text-lg">
                  {utilities.electric.prevUnit.toLocaleString()}
                </span>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-300 ring-1 ring-slate-100">
                <ArrowRight size={14} />
              </div>
              <div className="flex flex-1 flex-col items-end overflow-hidden">
                <span className="truncate text-[10px] text-slate-400 sm:text-xs">
                  ล่าสุด (ปัจจุบัน)
                </span>
                <span className="truncate text-base font-bold text-amber-600 sm:text-lg">
                  {utilities.electric.currentUnit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-lg sm:p-6">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14">
                  <Droplets
                    size={24}
                    strokeWidth={2}
                    fill="currentColor"
                    className="opacity-100"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                    ค่าน้ำประปา
                  </h3>
                  <p className="text-xs font-medium text-slate-400 sm:text-sm">
                    Water Supply
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
                  ยอดการใช้
                </span>
                <div className="flex items-baseline justify-end gap-1 text-blue-600">
                  <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {utilities.water.used}
                  </span>
                  <span className="text-xs font-semibold text-blue-600/70 sm:text-sm">
                    หน่วย
                  </span>
                </div>
              </div>
            </div>
            <div className="my-5 h-px w-full bg-slate-100"></div>

            <div className="mb-4">
              {utilities.water.imageUrl ? (
                <button
                  onClick={() => setPreviewImage(utilities.water.imageUrl)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:text-blue-800"
                >
                  <ImageIcon size={18} />
                  ดูรูปมิเตอร์น้ำ
                </button>
              ) : (
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-400"
                >
                  <CameraOff size={18} />
                  ไม่มีรูปภาพ
                </button>
              )}
            </div>
          </div>
          <div className="mt-auto rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
              <History size={14} />
              <span>เปรียบเทียบมิเตอร์ (Meter Reading)</span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="truncate text-[10px] text-slate-400 sm:text-xs">
                  ครั้งก่อน
                </span>
                <span className="truncate text-base font-medium text-slate-600 sm:text-lg">
                  {utilities.water.prevUnit.toLocaleString()}
                </span>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-300 ring-1 ring-slate-100">
                <ArrowRight size={14} />
              </div>
              <div className="flex flex-1 flex-col items-end overflow-hidden">
                <span className="truncate text-[10px] text-slate-400 sm:text-xs">
                  ล่าสุด (ปัจจุบัน)
                </span>
                <span className="truncate text-base font-bold text-blue-600 sm:text-lg">
                  {utilities.water.currentUnit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="animate-in fade-in fixed inset-0 z-999 flex items-center justify-center bg-slate-900/80 p-4 duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:top-6 sm:right-6"
          >
            <X size={24} />
          </button>

          <div
            className="animate-in zoom-in-95 relative flex max-h-full max-w-4xl flex-col items-center justify-center duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Meter Preview"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
