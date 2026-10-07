"use client";
import Link from "next/link";
import { Lock } from "lucide-react";

/** แทนฟอร์มเลขบัญชี/พร้อมเพย์ เมื่อเจ้าของหอยังไม่มีแพ็คเกจที่ใช้งานอยู่ */
export default function LockedFinanceCard() {
  return (
    <div className="border-border bg-background rounded-2xl border border-dashed p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Lock size={22} />
      </div>
      <h4 className="text-foreground text-base font-bold">
        ตั้งค่าการเงินต้องใช้แพ็คเกจ
      </h4>
      <p className="text-muted mx-auto mt-1 max-w-md text-sm">
        เลขบัญชีธนาคารและพร้อมเพย์สำหรับรับค่าเช่าจากผู้เช่าตั้งได้เมื่อมีแพ็คเกจ
        ส่วนรายละเอียดหอพัก ราคา ค่าน้ำ-ค่าไฟ และรูปภาพ ตั้งค่าและลงประกาศได้ฟรี
      </p>
      <Link
        href="/owner/billing?from=finance"
        className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        ดูแพ็คเกจและอัปเกรด
      </Link>
    </div>
  );
}
