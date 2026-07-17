"use client";
import React, { RefObject, useRef, useState, useEffect } from "react";

import {
  QrCode,
  CreditCard,
  X,
  Loader2,
  Copy,
  Upload,
  CheckCircle,
  Check,
  AlertTriangle,
  ShieldCheck,
  Info,
  ScanEye,
  FileX,
  Edit2,
  Lock,
  RefreshCw,
  Building2,
  ArrowDown,
  AlertCircle, // เพิ่ม icon นี้เข้ามา
} from "lucide-react";

import { TenantService } from "@/features/tenant/services/tenant.service";
import { toast } from "react-toastify";
import { useOnClickOutside, useScrollLock } from "usehooks-ts";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { QrGenerateResponse } from "../types";
import { PromptPayCard } from "./PromptPayCard";
import Tesseract from "tesseract.js";
import { extractSlipData, validateSlipContent } from "../lib/slip-verification";
import log from "@/lib/logger";

// นำเข้า THAI_BANKS แค่บรรทัดเดียวพอ (ลบที่ซ้ำออก)
import { THAI_BANKS } from "@/features/dormitory/components/DormPaymentSettings";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  dormId: string;
  billId: string;
  paymentSetting: any;
  currentStatus?:
    | "PENDING"
    | "WAITING_FOR_VERIFICATION"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";
  currentSlipUrl?: string | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  paymentSetting,
  billId,
  currentStatus = "PENDING",
  currentSlipUrl = null,
}: Props) {
  const hasBank = !!paymentSetting?.bankAccount;
  const hasPromptPay = !!paymentSetting?.promptPayId || true;
  const isLocked = currentStatus === "PAID";
  const [method, setMethod] = useState<"BANK" | "PROMPTPAY">(
    hasBank ? "BANK" : "PROMPTPAY",
  );
  const [dataQrcode, setDataQrcode] = useState<QrGenerateResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentSlipUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [slipData, setSlipData] = useState<any>({});
  const [isReuploading, setIsReuploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // หาข้อมูลธนาคารจาก paymentSetting.bankName
  const selectedBank = THAI_BANKS.find(
    (b) => b.id === paymentSetting?.bankName,
  );

  useEffect(() => {
    if (isOpen) {
      if (currentSlipUrl) {
        setPreviewUrl(currentSlipUrl);
        setIsReuploading(false);
      } else {
        setPreviewUrl(null);
        setIsReuploading(true);
      }

      if (hasBank && !hasPromptPay) setMethod("BANK");

      if (!hasBank && hasPromptPay) {
        setMethod("PROMPTPAY");
        handleGenerateQR();
      }
    }
  }, [hasBank, hasPromptPay, isOpen, currentSlipUrl]);

  const handleGenerateQR = async () => {
    setMethod("PROMPTPAY");

    if (dataQrcode) return;

    try {
      setLoadingQr(true);
      const res = await TenantService.generatePromptPayQR(billId);
      setDataQrcode(res);
    } catch (error) {
      toast.error("ไม่สามารถสร้าง QR Code ได้");
    } finally {
      setLoadingQr(false);
    }
  };

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 200;
            const color = avg > threshold ? 255 : 0;
            data[i] = color;
            data[i + 1] = color;
            data[i + 2] = color;
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        } else {
          resolve(img.src);
        }
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (previewUrl && !currentSlipUrl) URL.revokeObjectURL(previewUrl);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setIsReuploading(true);
      setIsScanning(true);

      try {
        const processedImageBase64 = await preprocessImage(file);

        const { data } = await Tesseract.recognize(
          processedImageBase64,
          "tha+eng",
        );

        const isValid = validateSlipContent(data.text);

        if (!isValid) {
          toast.warn("สลิปไม่ถูกต้องกรุณาตรวจสอบ", {
            icon: <FileX className="text-amber-500" />,
            autoClose: 6000,
          });
        } else {
          const extracted = extractSlipData(data.text);
          setSlipData(extracted);
        }
      } catch (error) {
        log.error("OCR Failed:", error);
        toast.error("อ่านข้อมูลสลิปไม่สำเร็จ (แต่ยังส่งได้)");
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleClearFile = () => {
    if (currentSlipUrl) {
      if (isReuploading) {
        setPreviewUrl(currentSlipUrl);
        setIsReuploading(false);
        setSelectedFile(null);
      }
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setPreviewUrl(null);
      setSelectedFile(null);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsScanning(false);
  };

  const startReupload = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsReuploading(true);
  };

  const cancelReupload = () => {
    setPreviewUrl(currentSlipUrl);
    setSelectedFile(null);
    setIsReuploading(false);
  };

  const processUpload = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setShowConfirm(false);

    await toast
      .promise(
        TenantService.uploadPaymentSlip(billId, selectedFile, slipData?.refNo),
        {
          pending: "กำลังอัพโหลดสลิปชำระเงิน...",

          success: {
            render({ data }) {
              return data?.message || "ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว";
            },
          },

          error: {
            render({ data }: { data: any }) {
              const errorMsg =
                data?.response?.data?.message ||
                data?.message ||
                "UNKNOWN_ERROR";
              console.error(errorMsg);

              switch (errorMsg) {
                case "SLIP_DUPLICATE":
                case "SLIP_DUPLICATE_REF":
                case "SLIP_DUPLICATE_DETECTED_FROM_IMAGE":
                  return "สลิปซ้ำ";
                case "INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED":
                  return "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)";
                case "BILL_NOT_FOUND":
                  return "ไม่พบข้อมูลบิล";
                case "FORBIDDEN_ACCESS":
                  return "คุณไม่มีสิทธิ์เข้าถึงบิลนี้";
                default:
                  return `เกิดข้อผิดพลาด: ${errorMsg.substring(0, 50)}`;
              }
            },
          },
        },
      )
      .finally(() => {
        setIsSubmitting(false);
        onClose();
      });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useOnClickOutside(ref as RefObject<HTMLDivElement>, () => {
    if (isOpen && !showConfirm) onClose();
  });

  if (!isOpen) return null;

  useScrollLock();

  return (
    <>
      <div className="fixed inset-0 z-50 flex bg-black/60 sm:items-center sm:justify-center">
        <div
          ref={ref}
          className="relative w-full overflow-hidden bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-full p-2 ${isLocked ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"}`}
              >
                {isLocked ? (
                  <CheckCircle size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </div>
              <h3 className="font-sans text-xl font-bold text-slate-800">
                {isLocked ? "ชำระเงินแล้ว" : "ชำระเงินปลอดภัย"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>
          <div className="custom-scrollbar max-h-[80vh] overflow-y-auto">
            <div
              className={`py-6 text-center text-white ${isLocked ? "bg-emerald-500" : "bg-linear-to-br from-indigo-600 to-violet-700"}`}
            >
              <p className="mb-1 text-sm font-medium text-white/80">
                {isLocked ? "ยอดที่ชำระแล้ว" : "ยอดชำระที่ต้องโอน"}
              </p>
              <h2 className="text-4xl font-black tracking-tight">
                ฿
                {total.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </h2>
            </div>
            {!isLocked && (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={18}
                />
                <div className="text-xs leading-relaxed text-amber-800">
                  <p className="mb-1 font-bold">ข้อควรระวัง:</p>
                  <p>
                    โปรดตรวจสอบ{" "}
                    <span className="font-bold text-amber-900 underline">
                      ชื่อบัญชีผู้รับโอน
                    </span>{" "}
                    ให้ถูกต้องก่อนกดยืนยัน
                  </p>
                </div>
              </div>
            )}
            {!isLocked && hasBank && hasPromptPay && (
              <div className="mx-6 mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  onClick={() => setMethod("BANK")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${method === "BANK" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <CreditCard size={16} />
                  บัญชีธนาคาร
                </button>
                <button
                  onClick={handleGenerateQR}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${method === "PROMPTPAY" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <QrCode size={16} />
                  PromptPay
                </button>
              </div>
            )}
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                <AlertCircle size={16} className="text-red-500" />
                <span>ชำระแล้วโปรดอัพโหลดสลิปด้านล่าง</span>
              </div>
            </div>

            <div className="p-6">
              {!isLocked && (
                <div className="mb-8">
                  {method === "BANK" ? (
                    <div className="rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                          ข้อมูลบัญชี
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          {/* ส่วนแสดง Logo และ ชื่อธนาคาร */}
                          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                            {selectedBank ? (
                              <img
                                src={selectedBank.logo}
                                alt={selectedBank.id}
                                className="h-10 w-10 rounded-full border border-slate-100 bg-white object-cover shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/banks/default.png";
                                }}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Building2 size={20} />
                              </div>
                            )}
                            <div>
                              <span className="block text-[11px] font-medium text-slate-400">
                                ธนาคาร
                              </span>
                              <span className="block text-sm font-bold text-slate-700">
                                {selectedBank?.name ||
                                  paymentSetting?.bankName ||
                                  "ไม่ระบุธนาคาร"}
                              </span>
                            </div>
                          </div>

                          {/* ส่วนแสดงเลขบัญชี */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="mb-1 text-[11px] font-medium text-slate-400">
                                เลขที่บัญชี
                              </p>
                              <p className="text-xl font-bold tracking-wider text-slate-800">
                                {paymentSetting?.bankAccount}
                              </p>
                            </div>
                            <div className="relative">
                              {copied && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[9px] text-nowrap text-white">
                                  คัดลอกแล้ว
                                </div>
                              )}
                              <button
                                onClick={() =>
                                  copyToClipboard(paymentSetting?.bankAccount)
                                }
                                className={`cursor-pointer rounded-lg p-2.5 transition-colors ${copied ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                              >
                                {copied ? (
                                  <Check size={18} />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ชื่อบัญชีผู้รับเงิน */}
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                          <p className="mb-1 text-[11px] font-bold text-indigo-400 uppercase">
                            ชื่อบัญชีผู้รับเงิน (ตรวจสอบชื่อนี้)
                          </p>
                          <p className="text-lg font-black text-indigo-900">
                            {paymentSetting?.bankHolder}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      {loadingQr ? (
                        <div className="flex w-full flex-col items-center justify-center gap-6 rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-12">
                          <div className="relative flex h-56 w-56 animate-pulse items-center justify-center rounded-xl bg-slate-200/70 shadow-inner">
                            <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                          </div>
                          <div className="flex w-full max-w-50 flex-col items-center gap-2.5">
                            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200"></div>
                            <div className="h-8 w-1/2 animate-pulse rounded-full bg-slate-200"></div>
                          </div>
                        </div>
                      ) : dataQrcode ? (
                        <PromptPayCard
                          qrData={dataQrcode.result}
                          amount={dataQrcode.total}
                          accountName={dataQrcode.promptPayName}
                        />
                      ) : (
                        <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <p className="text-sm text-slate-500">
                            ไม่สามารถโหลด QR Code ได้
                          </p>
                          <button
                            onClick={handleGenerateQR}
                            className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                          >
                            ลองใหม่
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 px-1 text-sm font-bold text-slate-700">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white ${isLocked ? "bg-green-500" : "bg-slate-800"}`}
                  >
                    {isLocked ? <Check size={12} /> : "2"}
                  </span>
                  {isLocked
                    ? "หลักฐานการโอนเงิน (ตรวจสอบแล้ว)"
                    : "อัพโหลดสลิปหลักฐาน"}
                </h4>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {!previewUrl && isReuploading && !isLocked && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition-all hover:border-indigo-300 hover:bg-indigo-50/30"
                  >
                    <div className="mb-3 rounded-full bg-white p-4 shadow-sm transition-transform group-hover:scale-110">
                      <Upload
                        className="text-slate-400 group-hover:text-indigo-500"
                        size={28}
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      กดเพื่อเลือกรูปภาพสลิป
                    </p>
                    <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      JPG, PNG เท่านั้น
                    </p>
                    {currentSlipUrl && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelReupload();
                        }}
                        className="mt-4 text-xs font-bold text-slate-400 underline hover:text-slate-600"
                      >
                        ยกเลิกการแก้ไข
                      </div>
                    )}
                  </button>
                )}
                {previewUrl && (
                  <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-100 shadow-inner">
                    {isScanning && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <ScanEye className="mb-3 h-10 w-10 animate-pulse text-indigo-400" />
                        <p className="text-sm font-bold text-white">
                          กำลังตรวจสอบความถูกต้อง...
                        </p>
                      </div>
                    )}
                    <img
                      src={previewUrl}
                      alt="Slip Preview"
                      className="block h-auto w-full"
                    />
                    {!isScanning && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        {!isLocked ? (
                          isReuploading ? (
                            <button
                              onClick={handleClearFile}
                              className="cursor-pointer rounded-full bg-rose-500 p-2 text-white shadow-lg transition-all hover:scale-110 hover:bg-rose-600"
                            >
                              <X size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={startReupload}
                              className="flex cursor-pointer items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-lg backdrop-blur transition-all hover:bg-white hover:text-indigo-600"
                            >
                              <Edit2 size={14} />
                              แก้ไขสลิป
                            </button>
                          )
                        ) : (
                          <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur">
                            <Lock size={12} />
                            ตรวจสอบแล้ว
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!isLocked && isReuploading && (
                  <button
                    disabled={!selectedFile || isSubmitting || isScanning}
                    onClick={() => setShowConfirm(true)}
                    className={`mt-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl p-3 text-lg font-black text-white transition-all ${!selectedFile || isSubmitting || isScanning ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none" : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 active:scale-95"}`}
                  >
                    {isSubmitting || isScanning ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <CheckCircle size={24} />
                        ยืนยันการส่งสลิป
                      </>
                    )}
                  </button>
                )}
                {!isReuploading && currentSlipUrl && !isLocked && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                    <p className="text-sm font-bold text-amber-700">
                      อยู่ในระหว่างการตรวจสอบ
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      หากคุณส่งสลิปผิด สามารถกดปุ่ม "แก้ไขสลิป"
                      ด้านบนเพื่อส่งใหม่ได้
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={processUpload}
        title="ยืนยันการส่งสลิป?"
        description={`สลิปใบเดิมจะถูกแทนที่ด้วยใบใหม่ ยอดเงิน ${total.toLocaleString()} บาท`}
        type="warning"
        confirmText="ยืนยัน ส่งใหม่"
        isLoading={isSubmitting}
      />
    </>
  );
}
