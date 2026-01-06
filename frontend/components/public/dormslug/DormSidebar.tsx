"use client";
import React from "react";
import { Phone, User, Droplets, Zap, Banknote, Facebook } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

// Line Icon SVG Component
const LineIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22 10.8c0-4.9-5.1-8.8-11.4-8.8s-11.4 3.9-11.4 8.8c0 4.3 3.8 7.9 9.5 8.7.4.1.9.3 1 .8.1.5.1 1-.1 1.6-.1.2-.6 1.6-.7 2 0 0-.2.9.5 1.1s3.7-2.3 5.1-4c3.9-.3 7.5-3.6 7.5-10.2z" />
  </svg>
);

export const DormSidebar: React.FC<{
  data: DormSlugResponse;
}> = ({ data }) => {
  const { settings, owner } = data;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
          <p className="mb-1 text-xs font-semibold tracking-wider uppercase opacity-80">
            ราคาเริ่มต้น
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold tracking-tight">
              {settings.roomPrice.toLocaleString()}
            </h2>
            <span className="text-lg font-medium opacity-90">บาท / เดือน</span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-800 uppercase">
            <Banknote size={16} className="text-slate-400" />
            ค่าใช้จ่ายเพิ่มเติม
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
              <span className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Droplets size={14} />
                </div>
                ค่าน้ำ
              </span>
              <span className="text-sm font-bold text-slate-900">
                {settings.waterRate}บ./หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
              <span className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Zap size={14} />
                </div>
                ค่าไฟ
              </span>
              <span className="text-sm font-bold text-slate-900">
                {settings.electricRate}บ./หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
              <span className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Banknote size={14} />
                </div>
                ส่วนกลาง
              </span>
              <span className="text-sm font-bold text-slate-900">
                {settings.commonFee || "ฟรี"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 shadow-inner">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">ติดต่อเจ้าของหอพัก</p>
            <p className="line-clamp-1 text-lg font-bold text-slate-900">
              {owner.fullName}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <a
            href={`tel:${owner.phone}`}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <Phone size={18} className="fill-current" />
            <span>โทร {owner.phone}</span>
          </a>
          <div className="grid grid-cols-2 gap-3">
            {owner.lineId && (
              <a
                href={`https://line.me/ti/p/~${owner.lineId.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-3 text-sm font-bold text-white shadow-md shadow-green-200 transition-all hover:-translate-y-0.5 hover:bg-[#05b34c] hover:shadow-green-300 active:scale-95"
              >
                <LineIcon className="h-4 w-4" />
                <span>Line</span>
              </a>
            )}
            {owner.facebook && (
              <a
                href={owner.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#166fe5] hover:shadow-blue-300 active:scale-95"
              >
                <Facebook size={18} className="fill-current" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
