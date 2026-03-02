"use client";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Receipt, ChevronRight } from "lucide-react";
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
      className="group relative flex cursor-pointer flex-col gap-4 border-b border-slate-100 bg-white p-5 transition-all duration-200 last:border-0 hover:bg-slate-50 active:bg-slate-100 md:flex-row md:items-center md:justify-between md:px-8 md:py-5"
      role="button"
      tabIndex={0}
      aria-label={`ดูรายละเอียดบิลประจำเดือน ${format(dateObj, "MMMM yyyy", {
        locale: th,
      })}`}
    >
      <div className="flex flex-1 items-center gap-4 sm:gap-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border sm:h-12 sm:w-12 ${bill.status === "PAID" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : bill.status === "OVERDUE" ? "border-rose-100 bg-rose-50 text-rose-600" : "border-indigo-100 bg-indigo-50 text-indigo-600"}`}
        >
          <Receipt
            size={22}
            strokeWidth={1.5}
            className="h-5 w-5 sm:h-6 sm:w-6"
          />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-600 sm:text-base">
            รอบบิล{" "}
            {format(dateObj, "MMMM yyyy", {
              locale: th,
            })}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 sm:text-xs">
            {bill.roomNumberSnapshot && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                ห้อง {bill.roomNumberSnapshot}
              </span>
            )}
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

      <div className="flex items-center justify-between gap-4 pl-14 sm:pl-17 md:w-auto md:flex-none md:justify-end md:gap-6 md:pl-0">
        <div className="flex flex-col text-left md:w-32 md:items-end md:text-right lg:w-40">
          <span className="text-[10px] font-medium text-slate-400 md:hidden">
            ยอดชำระ
          </span>
          <span className="text-base leading-tight font-bold text-slate-900 sm:text-lg">
            ฿
            {bill.total.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-end md:w-32 md:justify-center lg:w-40">
          <BillStatusBadge status={bill.status} />
        </div>

        <div className="flex shrink-0 items-center justify-center pl-2 md:pl-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-active:scale-90">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
