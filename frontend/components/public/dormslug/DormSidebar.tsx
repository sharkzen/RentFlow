"use client";
import React from "react";
import {
  Phone,
  MessageCircle,
  Facebook,
  Droplets,
  Zap,
  Sparkles,
} from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

// ใช้ SVG Line Icon เดิม
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
    // Single Unified Card with subtle shadow
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
      {/* Price Section: Clean & Bold */}
      <div className="p-6 pb-4">
        <p className="mb-1 text-sm font-medium text-slate-500">ราคาเริ่มต้น</p>
        <div className="flex items-baseline gap-2">
          {settings?.roomPrice != null ? (
            <>
              <h2 className="text-4xl font-bold text-slate-900">
                {settings.roomPrice.toLocaleString()}
              </h2>
              <span className="text-base font-medium text-slate-500">
                บาท/เดือน
              </span>
            </>
          ) : (
            <h2 className="text-2xl font-bold text-slate-400">ยังไม่กำหนด</h2>
          )}
        </div>
      </div>

      {/* Utilities Section: Minimal List */}
      <div className="mx-6 border-t border-slate-100 py-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          ค่าใช้จ่ายเพิ่มเติม
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <Droplets size={16} className="text-blue-400" /> ค่าน้ำ
            </span>
            <span className="font-medium text-slate-900">
              {settings?.waterRate != null
                ? `${settings.waterRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <Zap size={16} className="text-yellow-400" /> ค่าไฟ
            </span>
            <span className="font-medium text-slate-900">
              {settings?.electricRate != null
                ? `${settings.electricRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <Sparkles size={16} className="text-purple-400" /> ส่วนกลาง
            </span>
            <span className="font-medium text-slate-900">
              {/* ถ้ามีค่าใช้ค่าเดิม ถ้าเป็น null/undefined ให้แสดง 0 */}
              {settings?.commonFee ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Owner Section: Soft Background */}
      <div className="bg-slate-50/80 p-6">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            ติดต่อเจ้าของหอพัก
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {owner.fullName}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`tel:${owner.phone}`}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <Phone size={18} />
            โทร {owner.phone}
          </a>

          <div className="grid grid-cols-2 gap-3">
            {owner.lineId && (
              <a
                href={`https://line.me/ti/p/~${owner.lineId.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755]/10 px-4 py-3 text-sm font-semibold text-[#06C755] transition-colors hover:bg-[#06C755]/20"
              >
                <LineIcon className="h-5 w-5" />
                Line
              </a>
            )}
            {owner.facebook && (
              <a
                href={owner.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2]/10 px-4 py-3 text-sm font-semibold text-[#1877F2] transition-colors hover:bg-[#1877F2]/20"
              >
                <Facebook size={18} />
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
