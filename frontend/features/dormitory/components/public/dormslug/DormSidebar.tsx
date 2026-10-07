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
import { ShareButton } from "./ShareButton";

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
  const {
    name,
    settings,
    owner,
    availability,
    contacts,
    lineId,
    lineType,
    facebook,
  } = data;

  const shareText = settings?.roomPrice
    ? `${name} | เริ่มต้น ${settings.roomPrice.toLocaleString()} บาท/เดือน`
    : name;

  const lineUrl = lineId
    ? lineType === "OFFICIAL"
      ? `https://line.me/R/ti/p/${lineId}`
      : `https://line.me/ti/p/~${lineId}`
    : null;

  return (
    <div className="bg-surface border-border overflow-hidden border sm:rounded-2xl">
      <div className="p-6 pb-5">
        {/* Header: Price & Status */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted mb-1 text-xs font-semibold tracking-wider uppercase">
              ราคาเริ่มต้น
            </p>
            <div className="flex items-baseline gap-2">
              {settings?.roomPrice != null ? (
                <>
                  <span className="text-foreground text-4xl font-bold">
                    {settings.roomPrice.toLocaleString()}
                  </span>
                  <span className="text-muted text-sm font-medium">
                    บาท / เดือน
                  </span>
                </>
              ) : (
                <span className="text-muted text-xl font-semibold">
                  ยังไม่กำหนด
                </span>
              )}
            </div>
          </div>

          {/* ไม่มีห้องในระบบ = ไม่แสดงสถานะห้องว่าง */}
          {availability && availability.totalRooms > 0 && (
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
              <span className="text-foreground flex items-center gap-2 text-base font-semibold">
                <DoorOpen size={18} className="text-blue-500" /> ห้องว่างทั้งหมด
              </span>
              <span className="text-foreground text-base font-bold">
                {availability.totalAvailable} ห้อง
              </span>
            </div>

            {/* Split Air/Fan */}
            {(availability.airAvailable > 0 ||
              availability.fanAvailable > 0) && (
              <div className="border-border flex flex-col gap-2 border-t pt-3">
                {availability.airAvailable > 0 && (
                  <div className="text-muted flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Snowflake size={16} className="text-sky-500" /> แอร์
                    </span>
                    <span>{availability.airAvailable} ห้อง</span>
                  </div>
                )}
                {availability.fanAvailable > 0 && (
                  <div className="text-muted flex items-center justify-between text-sm font-medium">
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
      <div className="border-border border-t px-6 py-5">
        <p className="text-muted mb-4 text-xs font-semibold tracking-wider uppercase">
          ค่าใช้จ่ายเพิ่มเติม
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-2 text-sm">
              <Droplets size={15} className="text-blue-400" /> ค่าน้ำ
            </span>
            <span className="text-foreground text-sm font-semibold">
              {settings?.waterRate > 0
                ? settings?.waterBillingType === "FLAT_RATE"
                  ? `${settings.waterRate} บาท/ด. (เหมาจ่าย)`
                  : `${settings.waterRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-2 text-sm">
              <Zap size={15} className="text-yellow-400" /> ค่าไฟ
            </span>
            <span className="text-foreground text-sm font-semibold">
              {settings?.electricRate > 0
                ? `${settings.electricRate} บ./หน่วย`
                : "ยังไม่กำหนด"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-2 text-sm">
              <Sparkles size={15} className="text-purple-400" /> ส่วนกลาง
            </span>
            <span
              className={`text-sm font-semibold ${settings?.commonFee > 0 ? "text-foreground" : "text-emerald-500"}`}
            >
              {settings?.commonFee > 0 ? `${settings.commonFee} บาท` : "ไม่มี"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="border-border bg-surface border-t px-6 py-5">
        <p className="text-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
          ติดต่อห้องพัก
        </p>

        <div className="space-y-3">
          {contacts.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className="bg-foreground text-background flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-85 active:scale-95"
            >
              <Phone size={16} />
              {contact.name
                ? `${contact.name} · ${contact.phone}`
                : `โทร ${contact.phone}`}
            </a>
          ))}

          {(lineUrl || facebook) && (
            <div
              className={`grid gap-2 ${lineUrl && facebook ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {lineUrl && (
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755]/10 px-4 py-3 text-sm font-semibold text-[#06C755] transition-colors hover:bg-[#06C755]/20 active:scale-95"
                >
                  <LineIcon className="h-4 w-4" />
                  Line
                </a>
              )}
              {facebook && (
                <a
                  href={facebook}
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

          <ShareButton title={name} text={shareText} />
        </div>
      </div>
    </div>
  );
};
