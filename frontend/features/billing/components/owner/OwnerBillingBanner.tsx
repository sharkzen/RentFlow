"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Clock } from "lucide-react";
import { useOwnerBilling } from "../../context/OwnerBillingContext";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateTh = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

/**
 * แถบเตือนด้านบนทุกหน้าของเจ้าของหอ ปิดไม่ได้จนกว่าจะต่ออายุ (ต่างจาก modal ที่ปิดได้)
 * - เหลือ 7 วันลงมา (ทดลอง/ใช้งานอยู่): สีเหลือง
 * - ผ่อนผัน/หมดอายุ: สีแดง
 * ไม่แสดงในหน้าแพ็คเกจ เพราะหน้านั้นมีข้อมูลและปุ่มซื้ออยู่แล้ว
 */
export default function OwnerBillingBanner() {
  const pathname = usePathname();
  const { billing } = useOwnerBilling();

  if (!billing || !billing.enforced || pathname.startsWith("/owner/billing")) {
    return null;
  }

  const renewHref = `/owner/billing?plan=${billing.plan.id}&months=12`;

  if (
    (billing.status === "TRIAL" || billing.status === "ACTIVE") &&
    billing.periodEnd
  ) {
    const daysLeft = Math.ceil(
      (new Date(billing.periodEnd).getTime() - Date.now()) / DAY_MS,
    );

    if (daysLeft < 0 || daysLeft > 7) return null;

    const isTrial = billing.status === "TRIAL";
    const when = daysLeft <= 0 ? "วันนี้" : `ในอีก ${daysLeft} วัน`;

    return (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Clock size={18} className="shrink-0" />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">
            {isTrial ? `ช่วงทดลองใช้จะสิ้นสุด${when}` : `แพ็คเกจจะหมดอายุ${when}`}
          </span>{" "}
          ({dateTh(billing.periodEnd)}) ต่ออายุก่อนหมดเพื่อให้ใช้งานต่อเนื่อง
        </p>
        <Link
          href={renewHref}
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          {isTrial ? "เลือกแพ็คเกจ" : "ต่ออายุเลย"}
        </Link>
      </div>
    );
  }

  if (billing.status === "GRACE" || billing.status === "EXPIRED") {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <AlertTriangle size={18} className="shrink-0" />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">แพ็คเกจหมดอายุแล้ว</span>{" "}
          {billing.status === "GRACE"
            ? `ใช้งานได้แบบอ่านอย่างเดียวถึง ${dateTh(billing.graceEndsAt)}`
            : "ข้อมูลยังอยู่ครบ แต่เพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้"}
        </p>
        <Link
          href={renewHref}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
        >
          ต่ออายุเลย
        </Link>
      </div>
    );
  }

  return null;
}
