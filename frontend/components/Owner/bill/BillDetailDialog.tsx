"use client";
import { RefObject, useRef, useState } from "react";

import {
  X,
  Droplets,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Receipt,
  FileText,
} from "lucide-react";

import { Bill } from "@/features/bill/types";
import BillSlipSidebar from "./BillSlipSidebar";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";
import ConfirmDialog, {
  ConfirmDialogType,
} from "@/components/ui/ConfirmDialog";
import { BillService } from "@/features/bill/services/bill.service";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onUpdateStatus: (id: string, status: string) => void;
  onRefresh: () => void;
}

export default function BillDetailDialog({
  isOpen,
  onClose,
  bill,
  onUpdateStatus,
  onRefresh,
}: Props) {
  useScrollLock();
  console.log(bill);
  const detailRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(detailRef as RefObject<HTMLDivElement>, () => {
    if (!confirmConfig && window.innerWidth >= 768) {
      onClose();
    }
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    targetStatus: string;
    title: string;
    description: string;
    type: ConfirmDialogType;
    confirmText: string;
  } | null>(null);

  if (!isOpen || !bill) return null;

  const slipUrl = bill.payment?.slips?.[0]?.url;
  const currentStatus = bill.status;
  const isActionable =
    currentStatus === "PENDING" ||
    currentStatus === "WAITING_FOR_VERIFICATION" ||
    currentStatus === "OVERDUE";

  const handleActionClick = (status: "PAID" | "CANCELLED") => {
    if (status === "PAID") {
      const hasSlip = !!slipUrl;

      setConfirmConfig({
        isOpen: true,
        targetStatus: "PAID",
        title: hasSlip ? "ยืนยันการชำระเงิน" : "ยืนยันการรับเงินสด",
        description: hasSlip
          ? "ตรวจสอบยอดเงินและหลักฐานถูกต้องแล้วใช่หรือไม่?"
          : "บิลนี้ไม่มีหลักฐานการโอนแนบมา คุณได้รับ 'เงินสด' และต้องการยืนยันสถานะเป็นชำระแล้ว ใช่หรือไม่?",
        type: "success",
        confirmText: "ยืนยันการชำระ",
      });
    } else {
      setConfirmConfig({
        isOpen: true,
        targetStatus: "CANCELLED",
        title: "ยกเลิกบิลนี้?",
        description: "การกระทำนี้ไม่สามารถย้อนกลับได้",
        type: "error",
        confirmText: "ยืนยันการยกเลิก",
      });
    }
  };

  const handleConfirmAction = () => {
    if (confirmConfig) {
      onUpdateStatus(bill.id, confirmConfig.targetStatus);
      setConfirmConfig(null);
      onClose();
    }
  };

  const handleUploadSlip = async (file: File) => {
    try {
      await BillService.uploadSlip(bill.id, file);
      onRefresh();
      toast.success("อัปโหลดสลิปเรียบร้อย");
    } catch (error) {
      toast.error("อัปโหลดไม่สำเร็จ");
    }
  };

  const getStatusBadge = (status: string) => {
    const base =
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border";

    switch (status) {
      case "PAID":
        return (
          <span
            className={`${base} border-green-200 bg-green-50 text-green-700`}
          >
            <CheckCircle size={14} />
            ชำระแล้ว
          </span>
        );
      case "WAITING_FOR_VERIFICATION":
        return (
          <span className={`${base} border-blue-200 bg-blue-50 text-blue-700`}>
            <Clock size={14} />
            รอตรวจสอบ
          </span>
        );
      case "PENDING":
        return (
          <span
            className={`${base} border-yellow-200 bg-yellow-50 text-yellow-700`}
          >
            <Clock size={14} />
            รอชำระ
          </span>
        );
      case "OVERDUE":
        return (
          <span className={`${base} border-red-200 bg-red-50 text-red-700`}>
            <XCircle size={14} />
            เกินกำหนด
          </span>
        );
      case "CANCELLED":
        return (
          <span className={`${base} border-gray-200 bg-gray-50 text-gray-600`}>
            <XCircle size={14} />
            ยกเลิก
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 transition-all duration-300 sm:items-center sm:p-4">
        <div
          ref={detailRef}
          className="flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[85vh] sm:max-w-6xl sm:rounded-2xl"
        >
          <div className="flex flex-none items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 sm:hidden"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Receipt
                    className="hidden text-indigo-600 sm:block"
                    size={20}
                  />
                  รายละเอียดบิล
                </h3>
                <p className="text-xs text-gray-500 sm:text-sm">
                  {bill.roomNumberSnapshot}• {bill.tenantNameSnapshot}
                </p>
              </div>
              <div className="ml-2 scale-90 sm:scale-100">
                {getStatusBadge(bill.status)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="hidden cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 sm:flex"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/50">
              <div className="space-y-4 p-4 pb-6 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-blue-50 pb-2 font-bold text-blue-700">
                      <Droplets size={18} />
                      มิเตอร์น้ำ {bill?.waterRateSnapshot}/หน่วย
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>ก่อนหน้า</span>
                        <span>{bill.prevWaterUnitSnapshot}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>ล่าสุด</span>
                        <span>{bill.currentWaterUnitSnapshot}</span>
                      </div>
                      <div className="mt-1 flex justify-between rounded-lg bg-blue-50 p-2 text-xs font-bold text-blue-800">
                        <span>ใช้ {bill.waterUsedSnapshot}หน่วย</span>
                        <span>฿{bill.waterFeeSnapshot.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-amber-50 pb-2 font-bold text-amber-700">
                      <Zap size={18} />
                      มิเตอร์ไฟ {bill?.electricRateSnapshot}/หน่วย
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>ก่อนหน้า</span>
                        <span>{bill.prevElectricUnitSnapshot}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>ล่าสุด</span>
                        <span>{bill.currentElectricUnitSnapshot}</span>
                      </div>
                      <div className="mt-1 flex justify-between rounded-lg bg-amber-50 p-2 text-xs font-bold text-amber-800">
                        <span>ใช้ {bill.electricUsedSnapshot}หน่วย</span>
                        <span>
                          ฿{bill.electricFeeSnapshot.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-4 flex items-center gap-2 font-bold text-gray-700">
                    <FileText size={18} className="text-gray-400" />
                    สรุปยอดชำระ
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>ค่าห้อง</span>
                      <span className="font-medium text-gray-900">
                        ฿{bill.roomPriceSnapshot.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าน้ำ</span>
                      <span className="font-medium text-gray-900">
                        ฿{bill.waterFeeSnapshot.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าไฟ</span>
                      <span className="font-medium text-gray-900">
                        ฿{bill.electricFeeSnapshot.toLocaleString()}
                      </span>
                    </div>
                    {bill.commonFeeSnapshot > 0 && (
                      <div className="flex justify-between">
                        <span>ส่วนกลาง</span>
                        <span className="font-medium text-gray-900">
                          ฿{bill.commonFeeSnapshot.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {bill.lateFeeSnapshot > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>ค่าปรับ</span>
                        <span className="font-medium">
                          ฿{bill.lateFeeSnapshot.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-dashed pt-4">
                    <span className="text-xs text-gray-500">
                      ครบกำหนด{" "}
                      {new Date(bill.dueDate).toLocaleDateString("th-TH")}
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ฿{bill.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-8 border-t pt-6 sm:hidden">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <BillSlipSidebar
                      slipUrl={slipUrl}
                      payment={bill.payment}
                      onUpload={handleUploadSlip}
                      isEditable={bill.status !== "CANCELLED"}
                      isMobile={true}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden w-100 flex-col border-l border-gray-200 bg-white sm:flex lg:w-112.5">
              <div className="h-full overflow-y-auto">
                <BillSlipSidebar
                  slipUrl={slipUrl}
                  payment={bill.payment}
                  onUpload={handleUploadSlip}
                  isEditable={bill.status !== "CANCELLED"}
                  isMobile={false}
                />
              </div>
            </div>
          </div>
          {isActionable && (
            <div className="pb-safe-area z-20 flex-none border-t border-gray-100 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => handleActionClick("CANCELLED")}
                  className="flex cursor-pointer rounded-xl border border-red-100 px-6 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-95 sm:flex-none sm:py-3"
                >
                  ยกเลิกบิล
                </button>
                <button
                  onClick={() => handleActionClick("PAID")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCircle size={20} className="text-white/90" />
                  ยืนยันการชำระ
                </button>
              </div>
            </div>
          )}
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
