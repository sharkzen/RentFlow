"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  CheckSquare,
  Square,
  Send,
  User,
  Building,
  AlertCircle,
  Clock,
} from "lucide-react";

export interface BillSummary {
  id: string;
  roomId: string;
  roomNumberSnapshot: string;
  tenantNameSnapshot: string;
  total: number;
  status: string;
  lastNotifiedAt?: Date | string | null;
}

interface SendBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: BillSummary[];
  onSendBills: (selectedBillIds: string[]) => void;
}

export default function SendBillModal({
  isOpen,
  onClose,
  bills,
  onSendBills,
}: SendBillModalProps) {
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const neverNotifiedBills = bills.filter((b) => !b.lastNotifiedAt);
  const neverNotifiedIds = neverNotifiedBills.map((b) => b.id);

  useEffect(() => {
    if (isOpen && bills.length > 0) {
      setSelectedBillIds(neverNotifiedIds);
    } else {
      setSelectedBillIds([]);
    }
  }, [isOpen, bills]);

  if (!isOpen) return null;

  const isAllNeverNotifiedSelected =
    neverNotifiedIds.length > 0 &&
    neverNotifiedIds.every((id) => selectedBillIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllNeverNotifiedSelected) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(neverNotifiedIds);
    }
  };

  const handleToggleBill = (billId: string) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId],
    );
  };

  const handleConfirmSend = () => {
    if (selectedBillIds.length === 0) return;

    onSendBills(selectedBillIds);
  };

  const totalSelectedAmount = bills
    .filter((b) => selectedBillIds.includes(b.id))
    .reduce((sum, bill) => sum + bill.total, 0);

  const formatLastNotified = (dateString?: Date | string | null) => {
    if (!dateString) return null;

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex bg-slate-900/50 sm:items-center sm:justify-center sm:p-6 lg:p-8">
      <div className="animate-in zoom-in-95 flex h-screen w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[95vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                ส่งแจ้งเตือนชำระเงิน
              </h2>
              <p className="hidden text-sm text-slate-500 sm:block">
                เลือกรายการบิลเพื่อส่งอีเมลแจ้งเตือน
                (บิลที่เคยส่งแล้วจะไม่ถูกเลือกอัตโนมัติ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-slate-50 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <button
            onClick={handleToggleSelectAll}
            className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-blue-600"
          >
            {isAllNeverNotifiedSelected ? (
              <CheckSquare size={18} className="text-blue-600" />
            ) : (
              <Square size={18} className="text-slate-400" />
            )}
            เลือกเฉพาะที่ยังไม่เคยส่ง (
            {
              selectedBillIds.filter((id) => neverNotifiedIds.includes(id))
                .length
            }
            /{neverNotifiedIds.length})
          </button>
          <div className="self-end text-sm font-medium text-slate-500 sm:self-auto">
            ยอดรวมที่เลือก:{" "}
            <span className="text-base font-bold text-blue-600">
              ฿{totalSelectedAmount.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50/30">
          {bills.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-slate-400">
              <Building size={48} className="mb-4 opacity-20" />
              <p>ไม่มีบิลที่เข้าเงื่อนไขในขณะนี้</p>
            </div>
          ) : (
            <div className="min-w-[800px] p-4 sm:p-6">
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 rounded-t-lg border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase backdrop-blur-sm">
                <div className="col-span-1 flex items-center justify-center">
                  เลือก
                </div>
                <div className="col-span-2 flex items-center">ห้อง</div>
                <div className="col-span-3 flex items-center">ผู้เช่า</div>
                <div className="col-span-2 flex items-center justify-end">
                  ยอดรวม
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  สถานะ
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  ส่งล่าสุด
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {bills.map((bill) => {
                  const isSelected = selectedBillIds.includes(bill.id);
                  const isOverdue = bill.status === "OVERDUE";
                  const hasBeenNotified = !!bill.lastNotifiedAt;

                  return (
                    <label
                      key={bill.id}
                      className={`group grid cursor-pointer grid-cols-12 items-center gap-4 rounded-xl border px-4 py-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 ${isSelected ? "border-blue-400 bg-blue-50/30 shadow-sm" : "border-slate-200 bg-white"} ${isOverdue && !isSelected ? "border-red-200 bg-red-50/20" : ""} ${hasBeenNotified && !isSelected ? "opacity-80" : ""}`}
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleBill(bill.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 transition-all focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center font-bold text-slate-800">
                        {bill.roomNumberSnapshot}
                      </div>
                      <div className="col-span-3 flex items-center gap-2 text-sm text-slate-600">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <User size={12} />
                        </div>
                        <span className="truncate font-medium">
                          {bill.tenantNameSnapshot}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end font-semibold text-blue-600">
                        ฿{bill.total.toLocaleString()}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                            <AlertCircle size={12} />
                            เกินกำหนด
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                            รอดำเนินการ
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        {bill.lastNotifiedAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                            <Clock size={12} />
                            {formatLastNotified(bill.lastNotifiedAt)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            ยังไม่เคยส่ง
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:justify-end sm:px-6">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirmSend}
            disabled={selectedBillIds.length === 0}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            ยืนยันส่งบิล{" "}
            {selectedBillIds.length > 0 && `(${selectedBillIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
