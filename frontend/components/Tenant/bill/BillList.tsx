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
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
          <Receipt size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-700">ไม่พบรายการบิล</h3>
        <p className="text-sm text-slate-500">
          ลองเปลี่ยนตัวเลือกการค้นหา หรือยังไม่มีบิลในช่วงเวลานี้
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden border-b border-slate-100 bg-slate-50/50 px-8 py-4 text-xs font-bold tracking-wider text-slate-400 uppercase md:flex md:items-center">
        <div className="flex-1">รายละเอียดรอบบิล</div>
        <div className="w-40 text-right">ยอดชำระ</div>
        <div className="w-32 text-center">สถานะ</div>
        <div className="w-8"></div>
      </div>
      <div className="flex flex-col">
        {bills.map((bill) => (
          <BillItem key={bill.id} bill={bill} onClick={onSelectBill} />
        ))}
      </div>
    </div>
  );
}
