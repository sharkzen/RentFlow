"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { TenantService } from "@/features/tenant/services/tenant.service";
import LoadingPage from "@/components/layout/LoadingPage";
import log from "@/lib/logger";

import {
  ChevronLeft,
  Printer,
  CreditCard,
  Loader2,
  XCircle,
  CheckCircle,
  Clock,
  Edit,
  Receipt,
  Image as ImageIcon,
} from "lucide-react";

import { InvoiceVoucher } from "./InvoiceVoucher";
import PaymentModal from "./PaymentModal";
import MeterImageViewerModal from "./MeterImageViewerModal";
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
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const [printLoading, setPrintLoading] = useState(false);

  const fetchBill = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TenantService.getBillDetail(billId);
      setBill(data);
    } catch (err: any) {
      log.error(err);
      const backendError = err.response?.data?.error;
      const backendMessage = err.response?.data?.message;

      if (backendMessage === "BILL_NOT_FOUND") {
        setError("บิลนี้ไม่มีอยู่ในระบบ หรืออาจจะถูกเจ้าของหอพักลบไปแล้ว");
      } else if (backendMessage === "FORBIDDEN_ACCESS") {
        setError("สิทธิ์การเข้าถึงปฏิเสธ");
      } else {
        setError(backendError || "ไม่สามารถโหลดข้อมูลบิลได้ในขณะนี้");
      }
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
      <div className="animate-in fade-in zoom-in flex min-h-[80vh] flex-col items-center justify-center p-6 text-center duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 scale-150 rounded-full bg-slate-100/50 blur-3xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
            <Receipt className="h-10 w-10 text-slate-300" />
            <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm ring-4 ring-white">
              <XCircle size={20} />
            </div>
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-800">
          {error?.includes("สิทธิ์") ? "ไม่มีสิทธิ์เข้าถึง" : "ไม่พบข้อมูลบิล"}
        </h2>
        <p className="mx-auto mb-8 max-w-75 leading-relaxed text-slate-500">
          {error ||
            "บิลนี้อาจถูกลบไปแล้ว หรือคุณอาจเข้าใช้งานด้วยลิงก์ที่ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/tenant/bills")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
          >
            <ChevronLeft size={18} />
            กลับไปหน้ารายการบิล
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
          >
            ลองโหลดใหม่อีกครั้ง
          </button>
        </div>
        <p className="mt-12 text-xs text-slate-400">
          หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลหอพักของคุณ
        </p>
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
    setPrintLoading(true);

    try {
      const data = await TenantService.printBillTenant(id);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const blobType = isMobile
        ? "application/octet-stream"
        : "application/pdf";

      const blob = new Blob([data], {
        type: blobType,
      });

      const url = window.URL.createObjectURL(blob);
      const fileName = `bill-${id}.pdf`;

      if (isMobile) {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const printWindow = window.open(url);

        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      toast.dismiss(toastId);
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      toast.update(toastId, {
        render: "เกิดข้อผิดพลาดในการสร้างไฟล์ PDF",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setPrintLoading(false);
    }
  };

  const renderPaymentButton = () => {
    if (isCancelled) {
      return (
        <div className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-600 shadow-inner">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="truncate">ยกเลิกแล้ว</span>
        </div>
      );
    }

    if (paymentStatus === "VERIFIED") {
      return (
        <button
          onClick={() => setIsPayModalOpen(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-95"
        >
          <CheckCircle size={18} className="shrink-0" />
          <span className="truncate">ชำระเงินแล้ว</span>
        </button>
      );
    }

    if (paymentStatus === "WAITING_VERIFY") {
      return (
        <button
          onClick={() => setIsPayModalOpen(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-95"
        >
          <Clock size={18} className="shrink-0" />
          <span className="truncate">รอตรวจสอบ</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsPayModalOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95"
      >
        <CreditCard size={18} className="shrink-0" />
        <span className="truncate">
          {paymentStatus === "REJECTED" ? "ส่งหลักฐานใหม่" : "ชำระเงิน"}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mb-8 flex flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.push("/tenant/bills")}
          className="group flex w-max cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all group-hover:bg-slate-200 group-hover:text-slate-700">
            <ChevronLeft size={18} />
          </div>
          ย้อนกลับ
        </button>

        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
          <div className="order-3 col-span-2 w-full sm:order-1 sm:col-span-1 sm:w-auto">
            <button
              onClick={() => setIsMeterModalOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 shadow-sm ring-1 ring-blue-100 transition-all hover:bg-blue-100 hover:shadow-md active:scale-95"
            >
              <ImageIcon size={18} />
              รูปมิเตอร์
            </button>
          </div>

          <div className="order-1 col-span-1 w-full sm:order-2 sm:col-span-1 sm:w-auto">
            <button
              disabled={printLoading || isCancelled}
              onClick={() => handlePrint(bill.id)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={18} />
              <span className="truncate">พิมพ์ / PDF</span>
            </button>
          </div>

          <div className="order-2 col-span-1 w-full sm:order-3 sm:col-span-1 sm:w-auto">
            {renderPaymentButton()}
          </div>
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
      {isMeterModalOpen && (
        <MeterImageViewerModal
          isOpen={isMeterModalOpen}
          onClose={() => setIsMeterModalOpen(false)}
          bill={bill}
        />
      )}
    </div>
  );
}
