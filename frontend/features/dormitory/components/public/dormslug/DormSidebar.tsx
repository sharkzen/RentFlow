"use client";
import React from "react";
import {
  Phone,
  Facebook,
  Droplets,
  Zap,
  Sparkles,
  CheckCircle2,
  XCircle,
  DoorOpen,
  Snowflake,
  Wind,
} from "lucide-react";
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
  const { settings, owner, availability } = data;

  return (
    <div className="overflow-hidden bg-white sm:rounded-2xl">
      <div className="p-6 pb-5">
        {/* Header: Price & Status */}
        <div className="flex items-start justify-between">
          <div>
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

          {/* Status (Right Aligned, No Background, Larger Text) */}
          {availability && (
            <div className="mt-1 shrink-0 text-right">
              {availability.isAvailable ? (
                <span className="flex items-center justify-end gap-1.5 text-lg font-bold text-emerald-600">
                  <CheckCircle2 size={20} /> มีห้องว่าง
                </span>
              ) : (
                <span className="flex items-center justify-end gap-1.5 text-lg font-bold text-rose-600">
                  <XCircle size={20} /> ไม่ว่าง
                </span>
              )}
            </div>
          )}
        </div>

        {/* Availability Details */}
        {availability?.isAvailable && (
          <div className="mt-5 flex flex-col gap-3">
            {/* Total Rooms */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <DoorOpen size={18} className="text-blue-500" /> ห้องว่างทั้งหมด
              </span>
              <span className="text-base font-bold text-slate-900">
                {availability.totalAvailable} ห้อง
              </span>
            </div>

            {/* Split Air/Fan */}
            {(availability.airAvailable > 0 ||
              availability.fanAvailable > 0) && (
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
                {availability.airAvailable > 0 && (
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-2">
                      <Snowflake size={16} className="text-sky-500" /> แอร์
                    </span>
                    <span>{availability.airAvailable} ห้อง</span>
                  </div>
                )}
                {availability.fanAvailable > 0 && (
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-2">
                      <Wind size={16} className="text-teal-500" /> พัดลม
                    </span>
                    <span>{availability.fanAvailable} ห้อง</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
              {settings?.commonFee > 0 ? `${settings.commonFee} บาท` : "ไม่มี"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="border-t border-slate-100 bg-white px-6 py-5">
        <p className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          ติดต่อห้องพัก
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
                  href={`https://line.me/ti/p/~${owner.lineId}`}
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
