"use client";
import { Receipt } from "lucide-react";
import { BillData } from "./types";
import BillItem from "./BillItem";

interface Props {
  bills: BillData[];
  onSelectBill: (id: string) => void;
}

export default function BillList({ bills, onSelectBill }: Props) {
  if (bills.length === 0) {
    return (
      <div className="border-border bg-background flex min-h-75 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center md:p-12">
        <div className="bg-surface text-muted ring-border mb-4 rounded-full p-5 ring-1">
          <Receipt size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-foreground text-lg font-bold">ไม่พบรายการบิล</h3>
        <p className="text-muted mt-1 max-w-sm text-sm">
          ลองเปลี่ยนตัวเลือกการค้นหา หรืออาจจะยังไม่มีบิลในช่วงเวลานี้
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-3xl border">
      <div className="border-border bg-background/80 text-muted hidden border-b px-6 py-4 text-xs font-bold tracking-wider uppercase md:flex md:items-center md:gap-4 lg:px-8">
        <div className="flex-1">รายละเอียดรอบบิล</div>
        <div className="w-32 text-right lg:w-40">ยอดชำระ</div>
        <div className="w-32 text-center lg:w-40">สถานะ</div>
        <div className="w-8"></div>
      </div>
      <div className="divide-border flex flex-col divide-y">
        {bills.map((bill) => (
          <BillItem key={bill.id} bill={bill} onClick={onSelectBill} />
        ))}
      </div>
    </div>
  );
}
