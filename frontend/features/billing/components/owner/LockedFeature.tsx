"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Check, Gift, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { BillingService } from "../../services/billing.service";
import { useOwnerBilling } from "../../context/OwnerBillingContext";

const PERKS = [
  "จัดการผู้เช่าและสัญญาเช่า",
  "ออกบิลค่าเช่า น้ำ ไฟ อัตโนมัติ พร้อมส่งอีเมล",
  "ตรวจสลิปโอนเงินอัตโนมัติ",
  "รับแจ้งซ่อมและประกาศถึงผู้เช่า",
];

/** หน้าที่แสดงแทนเนื้อหา เมื่อเจ้าของหอพิมพ์ URL เข้าเมนูที่ยังไม่มีสิทธิ์ใช้งานโดยตรง */
export default function LockedFeature({ name }: { name: string }) {
  const { billing, refresh } = useOwnerBilling();
  const [claiming, setClaiming] = useState(false);

  const trial = billing?.trial.available ? billing.trial : null;

  const claimTrial = async () => {
    setClaiming(true);
    try {
      await BillingService.claimTrial();
      toast.success("เริ่มทดลองใช้งานแล้ว");
      await refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Lock size={36} />
      </div>
      <h1 className="text-foreground text-2xl font-bold">
        {name} ต้องใช้แพ็คเกจ
      </h1>
      <p className="text-muted mt-2 text-sm">
        ลงประกาศหอพักใช้ได้ฟรี ส่วนเครื่องมือจัดการหอพักเต็มรูปแบบต้องมีแพ็คเกจ
      </p>

      <ul className="border-border bg-surface mt-6 w-full space-y-2.5 rounded-2xl border p-5 text-left text-sm">
        {PERKS.map((perk) => (
          <li key={perk} className="text-foreground flex items-center gap-2.5">
            <Check size={16} className="shrink-0 text-emerald-500" />
            {perk}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
        {trial && (
          <button
            onClick={claimTrial}
            disabled={claiming}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Gift size={18} />
            {claiming ? "กำลังเปิดใช้งาน..." : `ทดลองฟรี ${trial.days} วัน`}
          </button>
        )}
        <Link
          href="/owner/billing"
          className="flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
        >
          ดูแพ็คเกจและอัปเกรด
        </Link>
      </div>
    </div>
  );
}
