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
    <div className="animate-in fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/50 p-0 sm:p-6 lg:p-8">
      <div className="bg-surface animate-in zoom-in-95 flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden shadow-2xl sm:h-[95vh] sm:rounded-2xl">
        <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-foreground text-base font-bold whitespace-nowrap sm:text-lg">
                ส่งแจ้งเตือนชำระเงิน
              </h2>
              <p className="text-muted hidden text-sm sm:block">
                เลือกรายการบิลเพื่อส่งอีเมลแจ้งเตือน
                (บิลที่เคยส่งแล้วจะไม่ถูกเลือกอัตโนมัติ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:bg-background hover:text-foreground shrink-0 cursor-pointer rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="border-border bg-background/50 flex shrink-0 flex-col justify-between gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <button
            onClick={handleToggleSelectAll}
            className="text-foreground flex w-fit items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors hover:text-blue-600"
          >
            {isAllNeverNotifiedSelected ? (
              <CheckSquare size={18} className="shrink-0 text-blue-600" />
            ) : (
              <Square size={18} className="text-muted shrink-0" />
            )}
            เลือกเฉพาะที่ยังไม่เคยส่ง (
            {
              selectedBillIds.filter((id) => neverNotifiedIds.includes(id))
                .length
            }
            /{neverNotifiedIds.length})
          </button>
          <div className="text-muted self-end text-sm font-medium whitespace-nowrap sm:self-auto">
            ยอดรวมที่เลือก:{" "}
            <span className="text-base font-bold text-blue-600">
              ฿{totalSelectedAmount.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="bg-background/30 flex-1 overflow-auto">
          {bills.length === 0 ? (
            <div className="text-muted flex h-full flex-col items-center justify-center py-10">
              <Building size={48} className="mb-4 opacity-20" />
              <p>ไม่มีบิลที่เข้าเงื่อนไขในขณะนี้</p>
            </div>
          ) : (
            <div className="min-w-[800px] p-4 sm:p-6">
              <div className="border-border bg-background/95 text-muted sticky top-0 z-10 grid grid-cols-12 gap-4 rounded-t-lg border-b px-4 py-3 text-xs font-semibold tracking-wider whitespace-nowrap uppercase backdrop-blur-sm">
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
                      className={`group grid cursor-pointer grid-cols-12 items-center gap-4 rounded-xl border px-4 py-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 ${isSelected ? "border-blue-400 bg-blue-50/30 shadow-sm" : "border-border bg-surface"} ${isOverdue && !isSelected ? "border-red-200 bg-red-50/20" : ""} ${hasBeenNotified && !isSelected ? "opacity-80" : ""}`}
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleBill(bill.id)}
                          className="border-border h-4 w-4 shrink-0 cursor-pointer rounded text-blue-600 transition-all focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-foreground col-span-2 flex items-center font-bold whitespace-nowrap">
                        {bill.roomNumberSnapshot}
                      </div>
                      <div className="text-muted col-span-3 flex items-center gap-2 overflow-hidden text-sm whitespace-nowrap">
                        <div className="bg-background text-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                          <User size={12} />
                        </div>
                        <span className="truncate font-medium">
                          {bill.tenantNameSnapshot}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end font-semibold whitespace-nowrap text-blue-600">
                        ฿{bill.total.toLocaleString()}
                      </div>
                      <div className="col-span-2 flex items-center justify-center whitespace-nowrap">
                        {isOverdue ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                            <AlertCircle size={12} />
                            เกินกำหนด
                          </span>
                        ) : (
                          <span className="inline-block shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                            รอดำเนินการ
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end whitespace-nowrap">
                        {bill.lastNotifiedAt ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                            <Clock size={12} />
                            {formatLastNotified(bill.lastNotifiedAt)}
                          </span>
                        ) : (
                          <span className="text-muted text-[11px] italic">
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
        <div className="border-border bg-surface flex shrink-0 items-center justify-between gap-3 border-t px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-6 sm:pb-4">
          <button
            onClick={onClose}
            className="text-muted hover:bg-background cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirmSend}
            disabled={selectedBillIds.length === 0}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Send size={16} className="shrink-0" />
            ยืนยันส่งบิล{" "}
            {selectedBillIds.length > 0 && `(${selectedBillIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
