"use client";
import React, { forwardRef } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { th } from "date-fns/locale";
import { IBillDetail } from "../types";
import Image from "next/image";

interface InvoiceProps {
  data: IBillDetail;
}

export const InvoiceVoucher = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ data }, ref) => {
    const {
      room,
      billingMonth,
      dueDate,
      tenantNameSnapshot,
      roomNumberSnapshot,
      waterBillingTypeSnapshot,
      prevWaterUnitSnapshot,
      currentWaterUnitSnapshot,
      waterUsedSnapshot,
      waterRateSnapshot,
      waterFeeSnapshot,
      prevElectricUnitSnapshot,
      currentElectricUnitSnapshot,
      electricUsedSnapshot,
      electricRateSnapshot,
      electricFeeSnapshot,
      roomPriceSnapshot,
      commonFeeSnapshot,
      lateFeeSnapshot,
      total,
      id,
      status,
      items,
    } = data;

    const dorm = room?.dormitory;
    const isPaid = status === "PAID";
    const isCancel = status === "CANCELLED";

    const getDaysLate = () => {
      if (status !== "OVERDUE") return 0;

      const today = new Date();
      const due = new Date(dueDate);
      const diff = differenceInCalendarDays(today, due);
      return diff > 0 ? diff : 0;
    };

    const daysLate = getDaysLate();

    const formatDateThai = (date: string | Date) => {
      const d = new Date(date);
      const buddhistYear = d.getFullYear() + 543;

      return (
        format(d, "d MMM", {
          locale: th,
        }) + ` ${buddhistYear}`
      );
    };

    const formatMoney = (amount: number) =>
      amount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });

    const chargeItems = items?.filter((item) => item.type === "CHARGE") || [];
    const discountItems =
      items?.filter((item) => item.type === "DISCOUNT") || [];

    return (
      <div
        ref={ref}
        className="flex flex-col print:m-0 print:h-[297mm] print:w-[210mm] print:p-[15mm] print:shadow-none"
      >
        <div className="border-foreground/80 flex items-start justify-between border-b-2 py-5">
          <div className="flex-1">
            <h1 className="text-foreground text-2xl leading-tight font-bold">
              {dorm?.name || "ชื่อหอพัก/อพาร์ทเมนท์"}
            </h1>
            <div className="text-muted mt-2 text-sm leading-relaxed">
              {dorm?.address || "ที่อยู่..."}
              <br />
              โทร: {dorm?.contacts?.[0]?.phone || "-"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-foreground mb-1 text-2xl font-black">
              {isPaid ? "ใบเสร็จรับเงิน" : "ใบแจ้งหนี้"}
            </div>
            <div className="text-foreground/80 text-lg font-bold uppercase">
              {isPaid ? "(Receipt)" : "(Invoice)"}
            </div>
            <div className="text-muted mt-3 text-sm">
              เลขที่:{" "}
              <span className="text-foreground font-bold">
                #{id.slice(0, 10).toUpperCase()}
              </span>
            </div>
            <div className="text-muted text-sm">
              วันที่:{" "}
              <span className="text-foreground font-bold">
                {format(new Date(), "d MMMM ", {
                  locale: th,
                })}
                {new Date().getFullYear() + 543}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-between gap-12">
          <div className="flex-1">
            <h3 className="border-border text-muted mb-2 border-b pb-1 text-xs font-bold tracking-wider uppercase">
              ผู้เช่า (Bill To)
            </h3>
            <div className="text-foreground text-xl font-bold">
              {tenantNameSnapshot}
            </div>
            <div className="text-muted mt-2 text-sm">
              ห้องเลขที่:{" "}
              <span className="text-foreground text-lg font-bold">
                {roomNumberSnapshot}
              </span>
            </div>
          </div>
          <div className="min-w-50 text-right">
            <h3 className="border-border text-muted mb-2 border-b pb-1 text-xs font-bold tracking-wider uppercase">
              รายละเอียด (Reference)
            </h3>
            <div className="text-foreground/80 text-sm">
              รอบบิลเดือน:{" "}
              <span className="font-bold">
                {(() => {
                  const bDate = new Date(billingMonth);

                  return (
                    format(bDate, "MMMM ", {
                      locale: th,
                    }) +
                    (bDate.getFullYear() + 543)
                  );
                })()}
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-red-600">
              กำหนดชำระ: <span>{formatDateThai(dueDate)}</span>
            </div>
          </div>
        </div>
        <div className="mt-8 flex-1">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-foreground/80 bg-background text-foreground border-y print:bg-slate-100">
                <th
                  className="px-3 py-4 font-bold"
                  style={{
                    width: "45%",
                  }}
                >
                  รายการ (Description)
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  หน่วย (Units)
                </th>
                <th className="px-3 py-4 text-right font-bold">ราคา/หน่วย</th>
                <th className="px-3 py-4 text-right font-bold">
                  จำนวนเงิน (Amount)
                </th>
              </tr>
            </thead>
            <tbody className="divide-border text-foreground/90 divide-y">
              <tr>
                <td className="text-foreground px-3 py-4 font-semibold">
                  ค่าเช่าห้องพัก
                </td>
                <td className="px-3 py-4 text-center">-</td>
                <td className="px-3 py-4 text-right">-</td>
                <td className="px-3 py-4 text-right font-bold">
                  {formatMoney(roomPriceSnapshot)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-4">
                  <div className="text-foreground font-semibold">
                    ค่าน้ำประปา
                    {waterBillingTypeSnapshot === "FLAT_RATE" && " (เหมาจ่าย)"}
                  </div>
                  {waterBillingTypeSnapshot !== "FLAT_RATE" && (
                    <div className="text-muted text-xs">
                      (มิเตอร์: {prevWaterUnitSnapshot}-{" "}
                      {currentWaterUnitSnapshot})
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 text-center">
                  {waterBillingTypeSnapshot === "FLAT_RATE"
                    ? "-"
                    : waterUsedSnapshot}
                </td>
                <td className="px-3 py-4 text-right">
                  {waterBillingTypeSnapshot === "FLAT_RATE"
                    ? "-"
                    : formatMoney(waterRateSnapshot)}
                </td>
                <td className="px-3 py-4 text-right font-bold">
                  {formatMoney(waterFeeSnapshot)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-4">
                  <div className="text-foreground font-semibold">ค่าไฟฟ้า</div>
                  <div className="text-muted text-xs">
                    (มิเตอร์: {prevElectricUnitSnapshot}-{" "}
                    {currentElectricUnitSnapshot})
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  {electricUsedSnapshot}
                </td>
                <td className="px-3 py-4 text-right">
                  {formatMoney(electricRateSnapshot)}
                </td>
                <td className="px-3 py-4 text-right font-bold">
                  {formatMoney(electricFeeSnapshot)}
                </td>
              </tr>
              {commonFeeSnapshot > 0 && (
                <tr>
                  <td className="text-foreground px-3 py-4 font-semibold">
                    ค่าส่วนกลาง
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="px-3 py-4 text-right font-bold">
                    {formatMoney(commonFeeSnapshot)}
                  </td>
                </tr>
              )}
              {status === "OVERDUE" && lateFeeSnapshot > 0 && (
                <tr>
                  <td className="px-3 py-4">
                    <div className="font-semibold text-red-600">
                      ค่าปรับล่าช้า
                    </div>
                    {daysLate > 0 && (
                      <div className="text-muted text-xs">
                        (ค้างชำระ {daysLate}วัน)
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="px-3 py-4 text-right font-bold text-red-600">
                    {formatMoney(lateFeeSnapshot)}
                  </td>
                </tr>
              )}
              {chargeItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-4">
                    <div className="text-foreground font-semibold">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="text-foreground px-3 py-4 text-right font-bold">
                    {formatMoney(item.amount)}
                  </td>
                </tr>
              ))}
              {discountItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-4">
                    <div className="font-semibold text-red-600">
                      {item.name}
                      <span className="ml-2 text-xs font-bold text-red-500">
                        (ส่วนลด/หักลบ)
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="px-3 py-4 text-right font-bold text-red-600">
                    -{formatMoney(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-foreground mt-6 border-t-2 pt-4">
          <div className="flex flex-col items-end">
            <div className="flex w-full items-center justify-end gap-12">
              <span className="text-muted text-lg font-medium uppercase">
                ยอดรวมสุทธิ (Total)
              </span>
              <span className="text-foreground text-4xl font-black">
                ฿{formatMoney(total)}
              </span>
            </div>
            <div className="text-muted mt-1 text-xs italic">
              * ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว (หากมี)
            </div>
          </div>
          <div className="border-border mt-12 flex items-end justify-between border-t pt-10">
            <div className="text-muted max-w-95 text-sm leading-relaxed">
              <span className="text-foreground/80 mb-1 block font-bold italic">
                หมายเหตุ:
              </span>
              {!isPaid
                ? "กรุณาตรวจสอบรายการและชำระเงินตามกำหนดเวลาที่ระบุไว้ข้างต้น"
                : "ขอบคุณที่ใช้บริการ เอกสารฉบับนี้ถือเป็นหลักฐานการรับเงินที่สมบูรณ์"}
            </div>
            <div className="flex flex-col items-center">
              <div className="border-muted relative mb-2 h-16 w-52 border-b border-dotted">
                {isPaid && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-80 print:opacity-100">
                    <Image
                      src="/images/Paid.png"
                      alt="Paid"
                      width={100}
                      height={100}
                    />
                  </div>
                )}
                {isCancel && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 rotate-[-13deg] opacity-80 print:opacity-100">
                    <Image
                      src="/images/Cancel.png"
                      alt="Cancel"
                      width={200}
                      height={200}
                    />
                  </div>
                )}
              </div>
              <div className="text-muted text-center text-sm font-bold uppercase">
                ผู้ออกเอกสาร / ผู้รับเงิน
                <br />
                <span className="text-muted text-[10px] font-normal">
                  (Authorized Signature)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceVoucher.displayName = "InvoiceVoucher";
