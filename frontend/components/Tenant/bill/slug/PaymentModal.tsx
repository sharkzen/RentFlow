"use client";
import React, { RefObject, use, useRef, useState } from "react";
import { QrCode, CreditCard, X, Loader2, Copy } from "lucide-react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { toast } from "react-toastify";
import { useOnClickOutside } from "usehooks-ts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  dormId: string;
  paymentSetting: any;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  dormId,
  paymentSetting,
}: Props) {
  const [method, setMethod] = useState<"BANK" | "PROMPTPAY">("BANK");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleGenerateQR = async () => {
    setMethod("PROMPTPAY");

    if (qrCode) return;

    try {
      setLoadingQr(true);
      const res = await TenantService.generatePromptPayQR(total, dormId);
      setQrCode(res.result);
    } catch (error) {
      toast.error("ไม่สามารถสร้าง QR Code ได้");
    } finally {
      setLoadingQr(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกเรียบร้อย");
  };

  useOnClickOutside(ref as RefObject<HTMLDivElement>, () => {
    if (isOpen) {
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={ref}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-xl font-bold text-slate-800">
            เลือกช่องทางชำระเงิน
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-indigo-50 p-6 text-center">
          <p className="text-sm text-indigo-600">ยอดชำระทั้งหมด</p>
          <h2 className="text-4xl font-bold text-indigo-900">
            ฿
            {total.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </h2>
        </div>

        <div className="grid grid-cols-2 border-b border-slate-100">
          <button
            onClick={() => setMethod("BANK")}
            className={`flex cursor-pointer items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${method === "BANK" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <CreditCard size={18} />
            โอนผ่านบัญชี
          </button>
          <button
            onClick={handleGenerateQR}
            className={`flex cursor-pointer items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${method === "PROMPTPAY" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <QrCode size={18} />
            สแกน QR Code
          </button>
        </div>

        <div className="p-6">
          {method === "BANK" ? (
            <div className="space-y-4">
              {paymentSetting?.bankAccount ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">ธนาคาร</p>
                  <p className="text-lg font-bold text-slate-800">
                    {paymentSetting.bankName}
                  </p>
                  <div className="my-2 h-px bg-slate-100"></div>
                  <p className="text-sm text-slate-500">เลขที่บัญชี</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xl font-bold tracking-wide text-indigo-600">
                      {paymentSetting.bankAccount}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(paymentSetting.bankAccount)
                      }
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    ชื่อ: {paymentSetting.bankHolder}
                  </p>
                </div>
              ) : (
                <p className="text-center text-slate-500">
                  ไม่พบข้อมูลบัญชีธนาคาร
                </p>
              )}
              <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
                เมื่อโอนเงินแล้ว กรุณาแจ้งสลิปการโอนเงินให้เจ้าหน้าที่
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              {loadingQr ? (
                <div className="flex h-48 w-48 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <Loader2 size={32} className="mb-2 animate-spin" />
                  <p className="text-xs">กำลังสร้าง QR Code...</p>
                </div>
              ) : qrCode ? (
                <>
                  <div className="rounded-2xl border-4 border-indigo-100 p-2">
                    <img
                      src={qrCode}
                      alt="PromptPay QR"
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    สแกน QR Code เพื่อชำระเงิน
                  </p>
                  <img
                    src="/promptpay-logo.png"
                    alt="PromptPay"
                    className="mt-2 h-8 opacity-70"
                  />
                </>
              ) : (
                <p className="text-rose-500">ไม่สามารถโหลด QR Code ได้</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
