"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { TenantService } from "@/features/tenant/services/tenant.service";
import LoadingPage from "@/components/layout/LoadingPage";

import {
  ChevronLeft,
  Printer,
  CreditCard,
  Loader2,
  XCircle,
  CheckCircle,
  Clock,
  Edit,
} from "lucide-react";

import { InvoiceVoucher } from "./InvoiceVoucher";
import PaymentModal from "./PaymentModal";
import { IBillDetail } from "../types";
import { toast } from "react-toastify";

export default function BillSlugContainer() {
  const params = useParams();
  const router = useRouter();
  const billId = params?.slug as string;
  const [bill, setBill] = useState<IBillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const data = await TenantService.getBillDetail(billId);
      setBill(data);
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลบิลได้ หรือคุณไม่มีสิทธิ์เข้าถึง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!billId) return;

    fetchBill();
  }, [billId]);

  const handleModalClose = () => {
    setIsPayModalOpen(false);
    fetchBill();
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingPage />
      </div>
    );

  if (error || !bill) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-slate-500">{error || "ไม่พบข้อมูล"}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-slate-200 px-4 py-2 font-medium transition hover:bg-slate-300"
        >
          หน้าหลัก
        </button>
      </div>
    );
  }

  const paymentStatus = bill.payment?.status;
  const billStatus = bill.status;
  const isCancelled = billStatus === "CANCELLED";
  const paymentSetting = bill.room?.dormitory?.paymentSetting;
  const latestSlip =
    bill.payment?.slips && bill.payment.slips.length > 0
      ? bill.payment.slips[bill.payment.slips.length - 1]
      : null;
  const currentSlipUrl = latestSlip?.url;

  const handlePrint = async (id: string) => {
    const toastId = toast.loading("กำลังสร้างไฟล์ PDF...");

    try {
      const data = await TenantService.printBillTenant(id);

      const blob = new Blob([data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.dismiss(toastId);
    } catch (error) {
      toast.update(toastId, {
        render: "เกิดข้อผิดพลาดในการสร้างไฟล์ PDF",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const renderPaymentButton = () => {
    if (isCancelled) {
      return (
        <div className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-red-100 px-6 py-3 text-sm font-bold text-red-600 shadow-inner max-sm:text-xs sm:flex-none">
          <XCircle className="h-5 w-5" />
          ยกเลิกแล้ว
        </div>
      );
    }

    if (paymentStatus === "VERIFIED") {
      return (
        <button
          onClick={() => setIsPayModalOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-95 max-sm:text-xs sm:flex-none"
        >
          <CheckCircle size={18} />
          ชำระเงินแล้ว (ดูสลิป)
        </button>
      );
    }

    if (paymentStatus === "WAITING_VERIFY") {
      return (
        <button
          onClick={() => setIsPayModalOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-95 max-sm:text-xs sm:flex-none"
        >
          <Clock size={18} />
          รอตรวจสอบ (แก้ไขสลิป)
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsPayModalOpen(true)}
        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95 max-sm:text-xs sm:flex-none"
      >
        <CreditCard size={18} />
        {paymentStatus === "REJECTED"
          ? "ส่งหลักฐานใหม่ (ถูกปฏิเสธ)"
          : "ชำระเงิน / แจ้งโอน"}
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <button
          onClick={() => router.push("/tenant/bills")}
          className="group flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all group-hover:bg-slate-200 group-hover:text-slate-700">
            <ChevronLeft size={18} />
          </div>
          ย้อนกลับ
        </button>
        <div className="flex w-full gap-3 sm:w-auto">
          <button
            disabled={isCancelled}
            onClick={() => handlePrint(bill.id)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 max-sm:text-xs sm:flex-none"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">พิมพ์ / PDF</span>
            <span className="sm:hidden">พิมพ์</span>
          </button>
          {renderPaymentButton()}
        </div>
      </div>
      <div className="flex w-full flex-col">
        <div className="w-full overflow-auto px-4">
          <InvoiceVoucher ref={componentRef} data={bill} />
        </div>
      </div>
      {isPayModalOpen && (
        <PaymentModal
          isOpen={isPayModalOpen}
          onClose={handleModalClose}
          total={bill.total}
          dormId={bill.room.dormitory.id}
          paymentSetting={paymentSetting}
          billId={bill.id}
          currentStatus={paymentStatus === "VERIFIED" ? "PAID" : billStatus}
          currentSlipUrl={currentSlipUrl}
        />
      )}
    </div>
  );
}
