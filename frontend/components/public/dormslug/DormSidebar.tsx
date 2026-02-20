"use client";
import React from "react";
import { Phone, Facebook, Droplets, Zap, Sparkles } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

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

export const DormSidebar: React.FC<{ data: DormSlugResponse }> = ({ data }) => {
  const { settings, owner } = data;

  return (
    <div className="overflow-hidden bg-white sm:rounded-2xl">
      {/* Price */}
      <div className="p-6 pb-5">
        <p className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          ราคาเริ่มต้น
        </p>
        <div className="flex items-baseline gap-2">
          {settings?.roomPrice != null ? (
            <>
              <span className="text-4xl font-bold text-slate-900">
                {settings.roomPrice.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500">
                บาท / เดือน
              </span>
            </>
          ) : (
            <span className="text-xl font-semibold text-slate-400">
              ยังไม่กำหนด
            </span>
          )}
        </div>
      </div>

      {/* Utilities */}
      <div className="border-t border-slate-100 px-6 py-5">
        <p className="mb-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          ค่าใช้จ่ายเพิ่มเติม
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <Droplets size={15} className="text-blue-400" /> ค่าน้ำ
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {settings?.waterRate > 0
                ? `${settings.waterRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <Zap size={15} className="text-yellow-400" /> ค่าไฟ
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {settings?.electricRate > 0
                ? `${settings.electricRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles size={15} className="text-purple-400" /> ส่วนกลาง
            </span>
            <span
              className={`text-sm font-semibold ${settings?.commonFee > 0 ? "text-slate-800" : "text-emerald-500"}`}
            >
              {settings?.commonFee > 0 ? `${settings.commonFee} บาท` : "ฟรี"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="border-t border-slate-100 bg-white px-6 py-5">
        <p className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          ติดต่อเจ้าของ
        </p>
        <p className="mb-4 text-base font-bold text-slate-900">
          {owner.fullName}
        </p>

        <div className="space-y-3">
          <a
            href={`tel:${owner.phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 active:scale-95"
          >
            <Phone size={16} />
            โทร {owner.phone}
          </a>

          {(owner.lineId || owner.facebook) && (
            <div
              className={`grid gap-2 ${owner.lineId && owner.facebook ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {owner.lineId && (
                <a
                  href={`https://line.me/ti/p/~${owner.lineId.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755]/10 px-4 py-3 text-sm font-semibold text-[#06C755] transition-colors hover:bg-[#06C755]/20 active:scale-95"
                >
                  <LineIcon className="h-4 w-4" />
                  Line
                </a>
              )}
              {owner.facebook && (
                <a
                  href={owner.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2]/10 px-4 py-3 text-sm font-semibold text-[#1877F2] transition-colors hover:bg-[#1877F2]/20 active:scale-95"
                >
                  <Facebook size={16} />
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
