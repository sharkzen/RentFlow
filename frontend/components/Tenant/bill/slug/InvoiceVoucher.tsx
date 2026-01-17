"use client";
import React, { forwardRef } from "react";
import { format } from "date-fns";
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
    } = data;

    const dorm = room?.dormitory;
    const isPaid = status === "PAID";
    const isCancel = status === "CANCELLED";

    const formatDateThai = (date: string) => {
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

    return (
      <div
        ref={ref}
        className="flex flex-col bg-white print:m-0 print:h-[297mm] print:w-[210mm] print:p-[15mm] print:shadow-none"
        style={{
          fontFamily: "'Sarabun', 'sans-serif'",
          boxSizing: "border-box",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <div className="flex items-start justify-between border-b-2 border-slate-800 py-5">
          <div className="flex-1">
            <h1 className="text-2xl leading-tight font-bold text-slate-900">
              {dorm?.name || "ชื่อหอพัก/อพาร์ทเมนท์"}
            </h1>
            <div className="mt-2 text-sm leading-relaxed text-slate-600">
              {dorm?.address || "ที่อยู่..."}
              <br />
              โทร: {dorm?.owner?.phone || "-"}
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-2xl font-black text-slate-900">
              {isPaid ? "ใบเสร็จรับเงิน" : "ใบแจ้งหนี้"}
            </div>
            <div className="text-lg font-bold text-slate-700 uppercase">
              {isPaid ? "(Receipt)" : "(Invoice)"}
            </div>
            <div className="mt-3 text-sm text-slate-500">
              เลขที่:{" "}
              <span className="font-bold text-slate-900">
                #{id.slice(0, 10).toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              วันที่:{" "}
              <span className="font-bold text-slate-900">
                {format(new Date(), "d MMMM", {
                  locale: th,
                })}{" "}
                {new Date().getFullYear() + 543}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-12">
          <div className="flex-1">
            <h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
              ผู้เช่า (Bill To)
            </h3>
            <div className="text-xl font-bold text-slate-900">
              {tenantNameSnapshot}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              ห้องเลขที่:{" "}
              <span className="text-lg font-bold text-slate-900">
                {roomNumberSnapshot}
              </span>
            </div>
          </div>
          <div className="min-w-50 text-right">
            <h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
              รายละเอียด (Reference)
            </h3>
            <div className="text-sm text-slate-700">
              รอบบิลเดือน:{" "}
              <span className="font-bold">
                {format(new Date(billingMonth), "MMMM ", {
                  locale: th,
                })}{" "}
                {new Date().getFullYear() + 543}
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
              <tr className="border-y border-slate-800 bg-slate-100 text-slate-900 print:bg-slate-100">
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
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="px-3 py-4 font-semibold text-slate-900">
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
                  <div className="font-semibold text-slate-900">
                    ค่าน้ำประปา
                  </div>
                  <div className="text-xs text-slate-500">
                    (มิเตอร์: {prevWaterUnitSnapshot}-{" "}
                    {currentWaterUnitSnapshot})
                  </div>
                </td>
                <td className="px-3 py-4 text-center">{waterUsedSnapshot}</td>
                <td className="px-3 py-4 text-right">
                  {formatMoney(waterRateSnapshot)}
                </td>
                <td className="px-3 py-4 text-right font-bold">
                  {formatMoney(waterFeeSnapshot)}
                </td>
              </tr>

              <tr>
                <td className="px-3 py-4">
                  <div className="font-semibold text-slate-900">ค่าไฟฟ้า</div>
                  <div className="text-xs text-slate-500">
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
                  <td className="px-3 py-4 font-semibold text-slate-900">
                    ค่าส่วนกลาง
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="px-3 py-4 text-right font-bold">
                    {formatMoney(commonFeeSnapshot)}
                  </td>
                </tr>
              )}

              {lateFeeSnapshot > 0 && (
                <tr>
                  <td className="px-3 py-4 font-semibold text-red-600">
                    ค่าปรับล่าช้า
                  </td>
                  <td className="px-3 py-4 text-center">-</td>
                  <td className="px-3 py-4 text-right">-</td>
                  <td className="px-3 py-4 text-right font-bold text-red-600">
                    {formatMoney(lateFeeSnapshot)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t-2 border-slate-900 pt-4">
          <div className="flex flex-col items-end">
            <div className="flex w-full items-center justify-end gap-12">
              <span className="text-lg font-medium text-slate-600 uppercase">
                ยอดรวมสุทธิ (Total)
              </span>
              <span className="text-4xl font-black text-slate-900">
                ฿{formatMoney(total)}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 italic">
              * ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว (หากมี)
            </div>
          </div>

          <div className="mt-12 flex items-end justify-between border-t border-slate-100 pt-10">
            <div className="max-w-95 text-sm leading-relaxed text-slate-500">
              <span className="mb-1 block font-bold text-slate-700 italic">
                หมายเหตุ:
              </span>
              {!isPaid
                ? "กรุณาตรวจสอบรายการและชำระเงินตามกำหนดเวลาที่ระบุไว้ข้างต้น"
                : "ขอบคุณที่ใช้บริการ เอกสารฉบับนี้ถือเป็นหลักฐานการรับเงินที่สมบูรณ์"}
            </div>
            <div className="flex flex-col items-center">
              <div className="relative mb-2 h-16 w-52 border-b border-dotted border-slate-400">
                {isPaid && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-80 print:opacity-100">
                    <Image
                      src="/images/Paid.png"
                      alt="Paid Stamp"
                      width={100}
                      height={100}
                    />
                  </div>
                )}

                {isCancel && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 rotate-[-13deg] opacity-80 print:opacity-100">
                    <Image
                      src="/images/Cancel.png"
                      alt="Cancel Stamp"
                      width={200}
                      height={200}
                    />
                  </div>
                )}
              </div>
              <div className="text-center text-sm font-bold text-slate-600 uppercase">
                ผู้ออกเอกสาร / ผู้รับเงิน
                <br />
                <span className="text-[10px] font-normal text-slate-400">
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
