"use client";
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { Bill } from "@/features/bill/types";
import ConfirmDialog, {
  ConfirmDialogType,
} from "@/components/ui/ConfirmDialog";

interface Props {
  bills: Bill[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetail: (bill: Bill) => void;
}

export default function BillTable({
  bills,
  isLoading,
  onViewDetail,
  onUpdateStatus,
}: Props) {
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    billId: string;
    targetStatus: string;
    title: string;
    description: string;
    type: ConfirmDialogType;
    confirmText: string;
  } | null>(null);

  const handleActionClick = (billId: string, action: "PAID" | "CANCELLED") => {
    const targetBill = bills.find((b) => b.id === billId);
    const hasSlip =
      targetBill?.payment?.slips && targetBill.payment.slips.length > 0;

    if (action === "PAID") {
      setConfirmConfig({
        isOpen: true,
        billId,
        targetStatus: "PAID",
        title: hasSlip ? "ยืนยันการชำระเงิน" : "ยืนยันการชำระเงิน?",
        description: hasSlip
          ? "คุณตรวจสอบหลักฐานและต้องการยืนยันว่าบิลนี้ชำระแล้วใช่หรือไม่?"
          : "บิลนี้ไม่มีหลักฐานการโอนแนบมา คุณได้รับ 'เงินสด' และต้องการยืนยันสถานะเป็นชำระแล้ว ใช่หรือไม่?",
        type: "success",
        confirmText: "ยืนยันการชำระ",
      });
    } else {
      setConfirmConfig({
        isOpen: true,
        billId,
        targetStatus: "CANCELLED",
        title: "ยกเลิกบิลนี้?",
        description:
          "การกระทำนี้ไม่สามารถย้อนกลับได้ คุณแน่ใจหรือไม่ที่จะยกเลิกบิลนี้",
        type: "error",
        confirmText: "ยืนยันการยกเลิก",
      });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmConfig) return;

    onUpdateStatus(confirmConfig.billId, confirmConfig.targetStatus);
    setConfirmConfig(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-75 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-500">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (!isLoading && bills.length === 0) {
    return (
      <div className="flex h-full min-h-75 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-400">
          <FileSearch className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <p>ไม่พบรายการบิล</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const base =
      "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

    switch (status) {
      case "PAID":
        return (
          <span
            className={`${base} bg-green-50 text-green-700 ring-green-600/20`}
          >
            <CheckCircle size={12} />
            ชำระแล้ว
          </span>
        );
      case "WAITING_FOR_VERIFICATION":
        return (
          <span className={`${base} bg-blue-50 text-blue-700 ring-blue-600/20`}>
            <Clock size={12} />
            รอตรวจสอบ
          </span>
        );
      case "PENDING":
        return (
          <span
            className={`${base} bg-yellow-50 text-yellow-700 ring-yellow-600/20`}
          >
            <AlertCircle size={12} />
            รอชำระ
          </span>
        );
      case "OVERDUE":
        return (
          <span className={`${base} bg-red-50 text-red-700 ring-red-600/20`}>
            <AlertCircle size={12} />
            เกินกำหนด
          </span>
        );
      case "CANCELLED":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 ring-gray-500/20`}>
            <XCircle size={12} />
            ยกเลิก
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const gridTemplate = "grid-cols-[2fr_1.5fr_1fr_1fr_100px]";

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-200px)] w-full flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`grid ${gridTemplate} gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-medium text-gray-500 uppercase`}
        >
          <div className="font-semibold tracking-wider">ห้อง / ผู้เช่า</div>
          <div className="font-semibold tracking-wider">ประจำเดือน</div>
          <div className="text-right font-semibold tracking-wider">ยอดรวม</div>
          <div className="text-center font-semibold tracking-wider">สถานะ</div>
          <div className="text-right font-semibold tracking-wider">จัดการ</div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-auto bg-white">
          <div className="min-w-335 text-nowrap">
            {bills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onViewDetail(bill)}
                className={`group grid ${gridTemplate} cursor-pointer items-center gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50`}
              >
                <div className="flex flex-col truncate">
                  <span className="truncate font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                    {bill.roomNumberSnapshot}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {bill.tenantNameSnapshot}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="text-right text-sm font-bold text-indigo-600">
                  ฿{bill.total.toLocaleString()}
                </div>
                <div className="flex justify-center">
                  {getStatusBadge(bill.status)}
                </div>
                <div
                  className="flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(bill.status === "PENDING" ||
                    bill.status === "WAITING_FOR_VERIFICATION" ||
                    bill.status === "OVERDUE") && (
                    <button
                      onClick={() => handleActionClick(bill.id, "PAID")}
                      className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 transition-all hover:bg-green-100 hover:shadow-sm active:scale-95"
                      title="ยืนยันการชำระ"
                    >
                      <CheckCircle size={14} />{" "}
                      <span className="hidden sm:inline">ยืนยัน</span>
                    </button>
                  )}
                  <button
                    onClick={() => onViewDetail(bill)}
                    className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 active:scale-95"
                    title="ดูรายละเอียด"
                  >
                    <Eye size={18} />
                  </button>
                  {(bill.status === "PENDING" || bill.status === "OVERDUE") && (
                    <button
                      onClick={() => handleActionClick(bill.id, "CANCELLED")}
                      className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95"
                      title="ยกเลิกบิล"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(null)}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          description={confirmConfig.description}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
        />
      )}
    </>
  );
}
