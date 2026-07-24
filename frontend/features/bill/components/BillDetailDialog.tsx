"use client";
import { RefObject, useRef, useState } from "react";
import log from "@/lib/logger";

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
  Plus,
  Info,
  Trash2,
  ChevronDown,
  PlusCircle,
  MinusCircle,
  Edit2,
  FileX,
} from "lucide-react";

import { Bill } from "@/features/bill/types";
import BillSlipSidebar from "./BillSlipSidebar";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";
import ConfirmDialog, { ConfirmDialogType } from "@/lib/ui/ConfirmDialog";
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
  const detailRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(detailRef as RefObject<HTMLDivElement>, () => {
    if (!confirmConfig && window.innerWidth >= 768) {
      onClose();
    }
  });

  useOnClickOutside(dropdownRef as RefObject<HTMLDivElement>, () => {
    setIsTypeDropdownOpen(false);
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    action:
      | "UPDATE_STATUS"
      | "USE_ADVANCE_PAYMENT"
      | "DELETE_ITEM"
      | "DELETE_BILL"
      | "REJECT_BILL"
      | "USE_ADVANCE_PAYMENT";
    targetStatus?: string;
    targetItemId?: string;
    title: string;
    description: string;
    type: ConfirmDialogType;
    confirmText: string;
  } | null>(null);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const [newItemData, setNewItemData] = useState({
    name: "",
    amount: "",
    type: "CHARGE" as "CHARGE" | "DISCOUNT",
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [editItemData, setEditItemData] = useState({
    name: "",
    amount: "",
    type: "CHARGE" as "CHARGE" | "DISCOUNT",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !bill) return null;

  const slipUrl = bill.payment?.slips?.[0]?.url;
  const currentStatus = bill.status;
  const isActionable =
    currentStatus === "PENDING" ||
    currentStatus === "WAITING_FOR_VERIFICATION" ||
    currentStatus === "OVERDUE";
  const canEditItems =
    bill.status === "PENDING" || bill.status === "OVERDUE";
  const advancePayment = (bill as any).tenant?.advancePayment || 0;
  const items = (bill as any).items || [];
  const chargeItems = items.filter((item: any) => item.type === "CHARGE");
  const discountItems = items.filter((item: any) => item.type === "DISCOUNT");
  const allItemsSorted = [...chargeItems, ...discountItems];
  const hasAppliedAdvance = items.some(
    (item: any) => item.name === "หักเงินค่าเช่าล่วงหน้า",
  );

  const handleActionClick = (status: "PAID" | "DELETE" | "REJECT") => {
    if (status === "PAID") {
      const hasSlip = !!slipUrl;

      setConfirmConfig({
        isOpen: true,
        action: "UPDATE_STATUS",
        targetStatus: "PAID",
        title: hasSlip ? "ยืนยันการชำระเงิน" : "ยืนยันการชำระเงิน?",
        description: hasSlip
          ? "ตรวจสอบยอดเงินและหลักฐานถูกต้องแล้วใช่หรือไม่?"
          : "บิลนี้ไม่มีหลักฐานการโอนแนบมา คุณได้รับ 'เงินสด' และต้องการยืนยันสถานะเป็นชำระแล้ว ใช่หรือไม่?",
        type: "success",
        confirmText: "ยืนยันการชำระ",
      });
    } else if (status === "DELETE") {
      setConfirmConfig({
        isOpen: true,
        action: "DELETE_BILL",
        title: "ยืนยันการลบบิล?",
        description:
          "ข้อมูลรายการชำระและสลิปของบิลนี้จะถูกลบทั้งหมด (หากมีการหักเงินล่วงหน้า ระบบจะคืนยอดให้ผู้เช่าอัตโนมัติ) การกระทำนี้ไม่สามารถย้อนกลับได้ ยืนยันหรือไม่?",
        type: "error",
        confirmText: "ลบบิลถาวร",
      });
    } else if (status === "REJECT") {
      setConfirmConfig({
        isOpen: true,
        action: "REJECT_BILL",
        title: "ยืนยันการปฏิเสธบิล?",
        description:
          "คุณต้องการปฏิเสธบิลนี้หรือไม่? ระบบจะส่งข้อความแจ้งผู้เช่าและให้ผู้เช่าแจ้งสลิปเข้ามาใหม่ ยืนยันหรือไม่?",
        type: "error",
        confirmText: "ปฏิเสธบิล",
      });
    }
  };

  const handleUseAdvancePaymentClick = () => {
    setConfirmConfig({
      isOpen: true,
      action: "USE_ADVANCE_PAYMENT",
      title: "ยืนยันการใช้เงินล่วงหน้า?",
      description: `ระบบจะดึงเงินมัดจำ/ล่วงหน้า จำนวน ฿${advancePayment.toLocaleString()} มาหักเป็นส่วนลดให้กับบิลเดือนนี้ คุณต้องการดำเนินการต่อหรือไม่?`,
      type: "info",
      confirmText: "ยืนยันการหักเงิน",
    });
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    const isAdvancePayment = itemName === "หักเงินค่าเช่าล่วงหน้า";

    setConfirmConfig({
      isOpen: true,
      action: "DELETE_ITEM",
      targetItemId: itemId,
      title: "ยืนยันการลบรายการ?",
      description: isAdvancePayment
        ? "คุณกำลังลบรายการหักเงินค่าเช่าล่วงหน้า ระบบจะทำการคืนยอดเงินทั้งหมดกลับไปให้ผู้เช่า ยืนยันหรือไม่?"
        : "คุณต้องการลบรายการนี้ใช่หรือไม่? ยอดรวมจะถูกคำนวณใหม่ทันที",
      type: "error",
      confirmText: isAdvancePayment ? "ยกเลิกการหักเงินและคืนยอด" : "ลบรายการ",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmConfig || !bill) return;

    if (confirmConfig.action === "UPDATE_STATUS") {
      onUpdateStatus(bill.id, confirmConfig.targetStatus as string);
      setConfirmConfig(null);
      onClose();
      return;
    }

    if (confirmConfig.action === "DELETE_BILL") {
      setIsProcessing(true);

      try {
        await toast.promise(BillService.deleteBill(bill.id), {
          pending: "กำลังลบข้อมูลบิลและไฟล์ที่เกี่ยวข้อง...",
          success: "ลบบิลเรียบร้อยแล้ว",

          error: {
            render({ data }: any) {
              const errorData = data?.response?.data;
              return errorData?.message || "เกิดข้อผิดพลาดในการลบบิล";
            },
          },
        });

        onRefresh();
        onClose();
      } catch (error) {
        console.error("DELETE BILL ERROR:", error);
      } finally {
        setIsProcessing(false);
        setConfirmConfig(null);
      }

      return;
    }

    if (confirmConfig.action === "DELETE_ITEM") {
      setIsProcessing(true);

      try {
        await toast.promise(
          BillService.deleteBillItem(
            bill.id,
            confirmConfig.targetItemId as string,
          ),
          {
            pending: "กำลังลบรายการ...",
            success: "ลบรายการเรียบร้อยแล้ว",

            error: {
              render({ data }: any) {
                const errorData = data?.response?.data;
                return errorData?.message || "เกิดข้อผิดพลาดในการลบรายการ";
              },
            },
          },
        );

        onRefresh();
      } catch (error) {
        console.error("DELETE ITEM ERROR:", error);
      } finally {
        setIsProcessing(false);
        setConfirmConfig(null);
      }

      return;
    }

    if (confirmConfig.action === "USE_ADVANCE_PAYMENT") {
      setIsProcessing(true);

      try {
        await toast.promise(BillService.applyAdvancePayment(bill.id), {
          pending: "กำลังดำเนินการหักเงินล่วงหน้า...",
          success: "หักเงินล่วงหน้าสำเร็จเรียบร้อย",

          error: {
            render({ data }: any) {
              const errorData = data?.response?.data;

              if (errorData?.message === "INSUFFICIENT_ADVANCE_PAYMENT") {
                return "ยอดเงินล่วงหน้าไม่เพียงพอ";
              }

              if (errorData?.message === "ADVANCE_PAYMENT_ALREADY_APPLIED") {
                return "บิลนี้มีการหักเงินล่วงหน้าไปแล้ว";
              }

              return errorData?.message || "เกิดข้อผิดพลาดในการหักเงิน";
            },
          },
        });

        onRefresh();
      } catch (error) {
        console.error("USE ADVANCE PAYMENT ERROR:", error);
      } finally {
        setIsProcessing(false);
        setConfirmConfig(null);
      }

      return;
    }

    if (confirmConfig.action === "REJECT_BILL") {
      setIsProcessing(true);

      try {
        await toast.promise(BillService.rejectBill(bill.id), {
          pending: "กำลังดำเนินการปฏิเสธบิล...",
          success: "ปฏิเสธบิลสำเร็จเรียบร้อย",

          error: {
            render({ data }: any) {
              const errorData = data?.response?.data;

              if (errorData?.message === "BILL_ALREADY_REJECTED") {
                return "บิลนี้ถูกปฏิเสธไปแล้ว";
              }

              if (errorData?.message === "CANNOT_REJECT_PAID_BILL") {
                return "ไม่สามารถปฏิเสธบิลที่ชำระเงินแล้วได้";
              }

              return errorData?.message || "เกิดข้อผิดพลาดในการปฏิเสธบิล";
            },
          },
        });

        onRefresh();
        onClose();
      } catch (error) {
        console.error("REJECT BILL ERROR:", error);
      } finally {
        setIsProcessing(false);
        setConfirmConfig(null);
      }

      return;
    }
  };

  const handleUploadSlip = async (file: File) => {
    try {
      await BillService.uploadSlipAsOwner(bill.id, file);
      onRefresh();
      toast.success("อัปโหลดสลิปเรียบร้อย");
    } catch (error) {
      toast.error("อัปโหลดไม่สำเร็จ");
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItemData.name || !newItemData.amount) {
      toast.warning("กรุณากรอกชื่อรายการและจำนวนเงิน");
      return;
    }

    setIsProcessing(true);

    try {
      await BillService.addBillItem(bill.id, {
        name: newItemData.name,
        amount: Number(newItemData.amount),
        type: newItemData.type,
      });

      toast.success("เพิ่มรายการสำเร็จ");
      setIsAddingItem(false);

      setNewItemData({
        name: "",
        amount: "",
        type: "CHARGE",
      });

      onRefresh();
    } catch (error) {
      toast.error("เพิ่มรายการไม่สำเร็จ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingItemId(item.id);

    setEditItemData({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
    });

    setIsAddingItem(false);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;

    if (!editItemData.name || !editItemData.amount) {
      toast.warning("กรุณากรอกชื่อรายการและจำนวนเงิน");
      return;
    }

    setIsProcessing(true);

    try {
      await BillService.updateBillItem(bill.id, editingItemId, {
        name: editItemData.name,
        amount: Number(editItemData.amount),
        type: editItemData.type,
      });

      toast.success("แก้ไขรายการสำเร็จ");
      setEditingItemId(null);
      onRefresh();
    } catch (error) {
      toast.error("แก้ไขรายการไม่สำเร็จ");
    } finally {
      setIsProcessing(false);
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
      <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/60 transition-all duration-300 sm:p-4 md:p-6">
        <div
          ref={detailRef}
          className="flex h-screen w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl"
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-indigo-600">
                    {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 sm:text-sm">
                    {bill.roomNumberSnapshot}• {bill.tenantNameSnapshot}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="scale-90 sm:scale-100">
                {getStatusBadge(bill.status)}
              </div>
              <button
                onClick={onClose}
                className="hidden cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 sm:flex"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
              <div className="mx-auto max-w-2xl space-y-5">
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
                {bill.status === "PENDING" &&
                  advancePayment > 0 &&
                  !hasAppliedAdvance && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <Info
                            className="mt-0.5 shrink-0 text-indigo-600"
                            size={20}
                          />
                          <div>
                            <h5 className="text-sm font-bold text-indigo-900">
                              ผู้เช่ามีเงินล่วงหน้าคงเหลือ: ฿
                              {advancePayment.toLocaleString()}
                            </h5>
                            <p className="mt-0.5 text-xs text-indigo-700">
                              สามารถนำเงินส่วนนี้มาหักลบกับยอดบิลเดือนนี้ได้
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleUseAdvancePaymentClick}
                          disabled={isProcessing}
                          className="w-full shrink-0 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
                        >
                          นำมาหักลบบิลนี้
                        </button>
                      </div>
                    </div>
                  )}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-bold text-gray-700">
                      <FileText size={18} className="text-gray-400" />
                      สรุปยอดชำระ
                    </h4>
                    {canEditItems &&
                      !isAddingItem &&
                      !editingItemId && (
                        <button
                          onClick={() => setIsAddingItem(true)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                        >
                          <Plus size={14} />
                          เพิ่มรายการอื่น
                        </button>
                      )}
                  </div>
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
                    {bill.lateFeeSnapshot > 0 && bill.status === "OVERDUE" && (
                      <div className="flex justify-between text-red-600">
                        <span>ค่าปรับ (เกินกำหนด)</span>
                        <span className="font-medium">
                          ฿{bill.lateFeeSnapshot.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {allItemsSorted && allItemsSorted.length > 0 && (
                      <div className="my-3 border-t border-dashed border-gray-200 pt-3">
                        <div className="space-y-3">
                          {allItemsSorted.map((item: any) => {
                            if (editingItemId === item.id) {
                              return (
                                <div
                                  key={item.id}
                                  className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"
                                >
                                  <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        placeholder="ชื่อรายการ"
                                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
                                        value={editItemData.name}
                                        disabled={
                                          item.name === "หักเงินค่าเช่าล่วงหน้า"
                                        }
                                        onChange={(e) =>
                                          setEditItemData({
                                            ...editItemData,
                                            name: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="w-full xl:w-28">
                                      <input
                                        type="number"
                                        placeholder="จำนวนเงิน"
                                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        value={editItemData.amount}
                                        onChange={(e) =>
                                          setEditItemData({
                                            ...editItemData,
                                            amount: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div
                                      className="relative w-full xl:w-32"
                                      ref={dropdownRef}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (
                                            item.name !==
                                            "หักเงินค่าเช่าล่วงหน้า"
                                          )
                                            setIsTypeDropdownOpen(
                                              !isTypeDropdownOpen,
                                            );
                                        }}
                                        className={`flex w-full cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-xs font-medium focus:outline-none ${editItemData.type === "CHARGE" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-700"} ${item.name === "หักเงินค่าเช่าล่วงหน้า" ? "cursor-not-allowed opacity-70" : ""}`}
                                      >
                                        <span className="flex items-center gap-1">
                                          {editItemData.type === "CHARGE" ? (
                                            <PlusCircle size={12} />
                                          ) : (
                                            <MinusCircle size={12} />
                                          )}
                                          {editItemData.type === "CHARGE"
                                            ? "บวกเพิ่ม"
                                            : "หักลบ (-)"}
                                        </span>
                                        <ChevronDown size={12} />
                                      </button>
                                      {isTypeDropdownOpen &&
                                        item.name !==
                                          "หักเงินค่าเช่าล่วงหน้า" && (
                                          <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-100 bg-white shadow-lg">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditItemData({
                                                  ...editItemData,
                                                  type: "CHARGE",
                                                });

                                                setIsTypeDropdownOpen(false);
                                              }}
                                              className="flex w-full items-center gap-1.5 px-2 py-2 text-xs hover:bg-gray-50"
                                            >
                                              <PlusCircle
                                                size={12}
                                                className="text-blue-500"
                                              />{" "}
                                              บวกเพิ่ม
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditItemData({
                                                  ...editItemData,
                                                  type: "DISCOUNT",
                                                });

                                                setIsTypeDropdownOpen(false);
                                              }}
                                              className="flex w-full items-center gap-1.5 border-t border-gray-50 px-2 py-2 text-xs hover:bg-gray-50"
                                            >
                                              <MinusCircle
                                                size={12}
                                                className="text-red-500"
                                              />{" "}
                                              หักลบ
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 justify-end gap-1.5">
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
                                      >
                                        <X size={14} />
                                      </button>
                                      <button
                                        onClick={handleSaveEdit}
                                        disabled={isProcessing}
                                        className="rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                                      >
                                        <CheckCircle size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                className="group flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
                              >
                                <div className="flex items-center gap-2">
                                  {item.type === "DISCOUNT" ? (
                                    <span className="flex shrink-0 items-center gap-1 rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                      <MinusCircle size={10} />
                                      หักลบ
                                    </span>
                                  ) : (
                                    <span className="flex shrink-0 items-center gap-1 rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                      <PlusCircle size={10} />
                                      เพิ่มเติม
                                    </span>
                                  )}
                                  <span className="wrap-break-word text-gray-700">
                                    {item.name}
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between gap-3 self-end sm:w-auto sm:justify-end sm:self-auto">
                                  <span
                                    className={`font-medium ${item.type === "DISCOUNT" ? "text-red-600" : "text-gray-900"}`}
                                  >
                                    {item.type === "DISCOUNT" ? "-" : ""}฿
                                    {item.amount.toLocaleString()}
                                  </span>
                                  {canEditItems &&
                                    !editingItemId && (
                                      <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleStartEdit(item)}
                                          disabled={isProcessing}
                                          className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteItem(item.id, item.name)
                                          }
                                          disabled={isProcessing}
                                          className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {isAddingItem && (
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                        <h5 className="mb-3 text-xs font-semibold text-indigo-900">
                          เพิ่มรายการค่าใช้จ่าย / ส่วนลด
                        </h5>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="เช่น ค่าล้างแอร์, ส่วนลด..."
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                              value={newItemData.name}
                              onChange={(e) =>
                                setNewItemData({
                                  ...newItemData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="w-full lg:w-32">
                            <div className="relative">
                              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-gray-500">
                                ฿
                              </span>
                              <input
                                type="number"
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-8 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                                value={newItemData.amount}
                                onChange={(e) =>
                                  setNewItemData({
                                    ...newItemData,
                                    amount: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div
                            className="relative w-full lg:w-36"
                            ref={dropdownRef}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setIsTypeDropdownOpen(!isTypeDropdownOpen)
                              }
                              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-200 focus:outline-none ${newItemData.type === "CHARGE" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-700"}`}
                            >
                              <span className="flex items-center gap-1.5">
                                {newItemData.type === "CHARGE" ? (
                                  <PlusCircle size={14} />
                                ) : (
                                  <MinusCircle size={14} />
                                )}
                                {newItemData.type === "CHARGE"
                                  ? "บวกเพิ่ม"
                                  : "หักลบ (-)"}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isTypeDropdownOpen && (
                              <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewItemData({
                                      ...newItemData,
                                      type: "CHARGE",
                                    });

                                    setIsTypeDropdownOpen(false);
                                  }}
                                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <PlusCircle
                                    size={14}
                                    className="text-blue-500"
                                  />{" "}
                                  บวกเพิ่ม (Charge)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewItemData({
                                      ...newItemData,
                                      type: "DISCOUNT",
                                    });

                                    setIsTypeDropdownOpen(false);
                                  }}
                                  className="flex w-full cursor-pointer items-center gap-2 border-t border-gray-50 px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                                >
                                  <MinusCircle
                                    size={14}
                                    className="text-red-500"
                                  />{" "}
                                  หักลบ (Discount)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2 border-t border-indigo-100/50 pt-3">
                          <button
                            onClick={() => {
                              setIsAddingItem(false);

                              setNewItemData({
                                name: "",
                                amount: "",
                                type: "CHARGE",
                              });
                            }}
                            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleSaveNewItem}
                            disabled={isProcessing}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            บันทึกรายการ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between border-t border-dashed border-gray-200 pt-4">
                    <span className="text-xs text-gray-500">
                      ครบกำหนด{" "}
                      {new Date(bill.dueDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ฿{bill.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-6 border-t border-gray-200 pt-6 sm:hidden">
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
            <div className="hidden w-full shrink-0 flex-col border-l border-gray-100 bg-slate-50/50 sm:flex sm:w-[320px] lg:w-100">
              <div className="custom-scrollbar h-full w-full overflow-y-auto p-0">
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
            <div className="pb-safe-area z-20 flex-none border-t border-gray-100 bg-white p-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={() => handleActionClick("DELETE")}
                    className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-red-100 px-6 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto"
                  >
                    <Trash2 size={18} />
                    ลบบิล
                  </button>
                  {currentStatus === "WAITING_FOR_VERIFICATION" && (
                    <button
                      onClick={() => handleActionClick("REJECT")}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 px-6 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto"
                    >
                      <FileX size={18} />
                      <span>สลิปไม่ถูกต้อง</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleActionClick("PAID")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-nowrap text-white shadow-sm hover:bg-green-700 disabled:opacity-70 sm:w-auto"
                >
                  <CheckCircle size={20} className="text-white/90" />
                  {slipUrl ? "ตรวจสอบสลิปและยืนยัน" : "ยืนยันรับชำระด้วยเงินสด"}
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
          isLoading={isProcessing}
        />
      )}
    </>
  );
}
