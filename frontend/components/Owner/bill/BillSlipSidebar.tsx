import {
  Image as ImageIcon,
  X,
  UploadCloud,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useScrollLock } from "usehooks-ts";
import log from "@/lib/logger";

interface Props {
  slipUrl?: string;
  payment?: {
    updatedAt: string;
    createdAt: string;
    status?: string;
  } | null;
  onUpload?: (file: File) => Promise<void>;
  isEditable?: boolean;
  isMobile?: boolean;
}

export default function BillSlipSidebar({
  slipUrl,
  payment,
  onUpload,
  isEditable = true,
  isMobile = false,
}: Props) {
  useScrollLock();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPaymentClosed =
    payment?.status === "VERIFIED" || payment?.status === "REJECTED";
  const canUpload = isEditable && onUpload && !isPaymentClosed;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      return;
    }

    if (onUpload) {
      try {
        setIsUploading(true);
        await onUpload(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        log.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div
      className={`flex w-full flex-col bg-slate-50/50 ${!isMobile ? "h-full" : ""}`}
    >
      <div
        className={`border-b border-gray-100 bg-white ${!isMobile ? "sticky top-0 z-10" : ""}`}
      >
        <h4 className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700">
          <ImageIcon size={18} className="text-gray-500" />
          หลักฐานการโอน
        </h4>
      </div>
      <div
        className={`flex-1 p-4 ${!isMobile ? "custom-scrollbar overflow-y-auto" : ""}`}
      >
        {slipUrl ? (
          <div className="flex flex-col gap-4">
            <div
              className="group relative w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
              onClick={() => setIsPreviewOpen(true)}
            >
              <div
                className={`relative flex w-full items-center justify-center bg-gray-50 ${isMobile ? "min-h-50" : "min-h-75"}`}
              >
                <img
                  src={slipUrl}
                  alt="Payment Slip"
                  className={`w-full object-contain ${isMobile ? "h-auto" : "max-h-[40vh]"}`}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg backdrop-blur-sm">
                  🔍 แตะเพื่อดูรูปใหญ่
                </span>
              </div>
            </div>
            {canUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-3 text-sm font-medium text-indigo-600 transition-all hover:bg-indigo-50 active:scale-95"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UploadCloud size={16} />
                )}
                {isUploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปสลิปใหม่"}
              </button>
            )}
            {isPreviewOpen && (
              <div
                className="animate-in fade-in zoom-in fixed inset-0 z-100 flex items-center justify-center bg-black/95 p-0 duration-200 sm:p-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewOpen(false);
                }}
              >
                <button className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
                  <X size={24} />
                </button>
                <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
                  <img
                    src={slipUrl}
                    alt="Slip Fullscreen"
                    className="max-h-none max-w-full rounded-lg shadow-2xl sm:max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            {canUpload ? (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${isMobile ? "h-48" : "h-60"} ${isUploading ? "cursor-wait border-gray-300 bg-gray-50" : "border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50"}`}
              >
                {isUploading ? (
                  <>
                    <Loader2
                      size={32}
                      className="mb-3 animate-spin text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-500">
                      กำลังอัปโหลด...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="mb-3 rounded-full bg-indigo-50 p-3 text-indigo-600 transition-transform group-hover:scale-110 group-hover:bg-indigo-100">
                      <UploadCloud size={28} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      อัปโหลดสลิป
                    </p>
                    <p className="text-xs text-gray-400">แตะเพื่อเลือกรูปภาพ</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-3 rounded-full bg-gray-100 p-4">
                  <ImageIcon size={28} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">ไม่มีหลักฐานการโอน</p>
                {isPaymentClosed && (
                  <p className="mt-1 text-xs text-gray-400">
                    (สถานะปิดการอัปโหลด)
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      {payment && (
        <div
          className={`border-t border-gray-200 bg-white p-4 ${isMobile ? "" : "mt-auto"}`}
        >
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
            <CalendarClock
              size={16}
              className="mt-0.5 shrink-0 text-gray-400"
            />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-900">
                ข้อมูลการแนบ
              </p>
              <p className="text-[10px] text-gray-500">
                แก้ไขล่าสุด:{" "}
                {payment.updatedAt
                  ? new Date(payment.updatedAt).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-"}
              </p>
              <div className="flex items-center gap-2 text-[10px]">
                สถานะ:
                <span
                  className={`rounded-full px-1.5 py-0.5 font-medium ${payment.status === "VERIFIED" ? "bg-green-100 text-green-700" : payment.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
