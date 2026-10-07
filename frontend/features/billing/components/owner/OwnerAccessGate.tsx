"use client";
import React from "react";
import { usePathname } from "next/navigation";
import {
  MANAGE_FEATURES,
  useOwnerBilling,
} from "../../context/OwnerBillingContext";
import LockedFeature from "./LockedFeature";

/**
 * ครอบเนื้อหาหน้าเจ้าของหอ: ถ้าเข้าเมนูงานจัดการที่ยังไม่มีสิทธิ์ (ล็อก) จะแสดงหน้าล็อก
 * แทนหน้าว่าง/error จาก API ส่วนแพ็คเกจหมดอายุ (อ่านอย่างเดียว) ยังเข้าดูข้อมูลได้
 */
export default function OwnerAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { billing } = useOwnerBilling();

  const feature = MANAGE_FEATURES.find(
    (f) => pathname === f.prefix || pathname.startsWith(f.prefix + "/"),
  );

  if (feature && billing?.enforced && billing.access === "locked") {
    return <LockedFeature name={feature.name} />;
  }

  return <>{children}</>;
}
