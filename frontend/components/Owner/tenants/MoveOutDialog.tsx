"use client";
import React, { useState } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import DatePickerTh from "@/components/ui/DatePickerTh";

interface MoveOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  tenantName: string;
  isLoading: boolean;
}

export default function MoveOutDialog({
  isOpen,
  onClose,
  onConfirm,
  tenantName,
  isLoading,
}: MoveOutDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  if (!isOpen) return null;

  const isFutureDate = () => {
    if (!selectedDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return sel.getTime() > today.getTime();
  };

  const isFuture = isFutureDate();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 transition-all">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="text-lg font-bold">แจ้งย้ายออกผู้เช่า</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-4 text-sm text-gray-600">
            คุณกำลังดำเนินการแจ้งย้ายออกสำหรับ{" "}
            <strong className="text-gray-900">{tenantName}</strong>
          </p>
          <div className="mb-6">
            <DatePickerTh
              label="เลือกวันที่ย้ายออก"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
          </div>
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${isFuture ? "border-blue-100 bg-blue-50 text-blue-700" : "border-red-100 bg-red-50 text-red-700"}`}
          >
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              {isFuture ? (
                <>
                  <strong>ตั้งเวลาย้ายออกล่วงหน้า:</strong>{" "}
                  ระบบจะจดจำวันที่เอาไว้
                  และจะทำการคืนห้องว่างพร้อมปิดบัญชีผู้เช่าอัตโนมัติ{" "}
                  <strong>ในวันที่กำหนด</strong>
                </>
              ) : (
                <>
                  <strong>ย้ายออกทันที:</strong>เมื่อกดยืนยัน
                  ห้องพักจะเปลี่ยนสถานะเป็นว่าง และปิดบัญชีผู้เช่า{" "}
                  <strong>ทันที</strong>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedDate)}
            disabled={isLoading || !selectedDate}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${isFuture ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isLoading
              ? "กำลังดำเนินการ..."
              : isFuture
                ? "ตั้งเวลาย้ายออก"
                : "ยืนยันย้ายออก"}
          </button>
        </div>
      </div>
    </div>
  );
}
