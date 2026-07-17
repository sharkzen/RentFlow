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
      <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center md:p-12">
        <div className="mb-4 rounded-full bg-white p-5 text-slate-400 ring-1 ring-slate-100">
          <Receipt size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-700">ไม่พบรายการบิล</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          ลองเปลี่ยนตัวเลือกการค้นหา หรืออาจจะยังไม่มีบิลในช่วงเวลานี้
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="hidden border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase md:flex md:items-center md:gap-4 lg:px-8">
        <div className="flex-1">รายละเอียดรอบบิล</div>
        <div className="w-32 text-right lg:w-40">ยอดชำระ</div>
        <div className="w-32 text-center lg:w-40">สถานะ</div>
        <div className="w-8"></div>
      </div>
      <div className="flex flex-col divide-y divide-slate-100">
        {bills.map((bill) => (
          <BillItem key={bill.id} bill={bill} onClick={onSelectBill} />
        ))}
      </div>
    </div>
  );
}
