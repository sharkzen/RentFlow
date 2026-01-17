"use client";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Receipt, Calendar, ChevronRight } from "lucide-react";
import { BillData } from "./types";
import BillStatusBadge from "./BillStatusBadge";

interface Props {
  bill: BillData;
  onClick: (id: string) => void;
}

export default function BillItem({ bill, onClick }: Props) {
  const dateObj = new Date(bill.billingMonth);
  const dueDateObj = new Date(bill.dueDate);

  return (
    <div
      onClick={() => onClick(bill.id)}
      className="group relative flex cursor-pointer flex-col gap-4 border-b border-slate-100 bg-white p-6 transition-colors last:border-0 hover:bg-slate-50 md:flex-row md:items-center md:justify-between md:px-8 md:py-5"
    >
      <div className="flex items-center gap-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${bill.status === "PAID" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : bill.status === "OVERDUE" ? "border-rose-100 bg-rose-50 text-rose-600" : "border-indigo-100 bg-indigo-50 text-indigo-600"}`}
        >
          <Receipt size={22} strokeWidth={1.5} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 md:text-base">
            รอบบิล{" "}
            {format(dateObj, "MMMM yyyy", {
              locale: th,
            })}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
              ห้อง {bill.roomNumberSnapshot}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              ครบกำหนด{" "}
              {format(dueDateObj, "d MMM yy", {
                locale: th,
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-6 pl-17 md:flex-1 md:justify-end md:pl-0">
        <div className="flex flex-col md:w-40 md:items-end">
          <span className="text-lg font-bold text-slate-900">
            ฿
            {bill.total.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] font-medium text-slate-400 md:hidden">
            ยอดชำระ
          </span>
        </div>
        <div className="flex items-center gap-4 md:w-32 md:justify-center">
          <BillStatusBadge status={bill.status} />
        </div>
        <div className="hidden text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-indigo-500 md:block">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
}
