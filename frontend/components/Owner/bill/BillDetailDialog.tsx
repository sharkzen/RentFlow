import { useState } from "react";

import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Calendar,
  Droplets,
  Zap,
  DollarSign,
} from "lucide-react";

import { Bill } from "@/features/bill/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function BillDetailDialog({
  isOpen,
  onClose,
  bill,
  onUpdateStatus,
}: Props) {
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);

  if (!isOpen || !bill) return null;

  const slipUrl = bill.payment?.slips?.[0]?.url;

  const handleUpdate = (status: string) => {
    onUpdateStatus(bill.id, status);
    onClose();
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <FileText className="text-indigo-600" size={20} />
                รายละเอียดบิล
              </h3>
              <p className="text-sm text-gray-500">
                ประจำเดือน{" "}
                {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {bill.roomNumberSnapshot}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {bill.tenantNameSnapshot}
                  </p>
                  <p className="text-sm text-gray-500">ผู้เช่าปัจจุบัน</p>
                </div>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${bill.status === "PAID" ? "border-green-200 bg-green-50 text-green-700" : bill.status === "PENDING" ? "border-yellow-200 bg-yellow-50 text-yellow-700" : bill.status === "OVERDUE" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}
              >
                {bill.status === "PAID"
                  ? "ชำระแล้ว"
                  : bill.status === "PENDING"
                    ? "รอชำระ"
                    : bill.status === "OVERDUE"
                      ? "เกินกำหนด"
                      : "ยกเลิก"}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-700 uppercase">
                  มิเตอร์น้ำ-ไฟ
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <Droplets size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">มิเตอร์น้ำ</p>
                      <p className="font-mono font-bold text-gray-800">
                        {bill.waterUnitSnapshot.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          หน่วย
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">มิเตอร์ไฟ</p>
                      <p className="font-mono font-bold text-gray-800">
                        {bill.electricUnitSnapshot.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          หน่วย
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
                  รายละเอียดค่าใช้จ่าย
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-dashed border-gray-100 py-2">
                    <span className="text-gray-600">ค่าห้อง</span>
                    <span className="font-medium">
                      ฿{bill.roomPriceSnapshot.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-dashed border-gray-100 py-2">
                    <span className="text-gray-600">
                      ค่าน้ำ ({bill.waterRateSnapshot}บ./หน่วย)
                    </span>
                    <span className="font-medium text-gray-900">-</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-100 py-2">
                    <span className="text-gray-600">
                      ค่าไฟ ({bill.electricRateSnapshot}บ./หน่วย)
                    </span>
                    <span className="font-medium text-gray-900">-</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-100 py-2">
                    <span className="text-gray-600">ค่าส่วนกลาง</span>
                    <span className="font-medium">
                      ฿{bill.commonFeeSnapshot.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 pt-3">
                    <span className="text-lg font-bold text-gray-800">
                      รวมทั้งหมด
                    </span>
                    <span className="text-xl font-bold text-indigo-600">
                      ฿{bill.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
            {bill.status === "PENDING" && (
              <>
                <button
                  onClick={() => handleUpdate("CANCELLED")}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-red-600"
                >
                  ยกเลิกบิล
                </button>
                <button
                  onClick={() => handleUpdate("PAID")}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                >
                  <CheckCircle size={16} />
                  ยืนยันการชำระ
                </button>
              </>
            )}
            {bill.status === "PAID" && (
              <button className="flex cursor-default items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                <CheckCircle size={16} />
                ชำระเรียบร้อยแล้ว
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col border-l border-gray-200 bg-gray-100 md:w-80">
          <div className="border-b bg-gray-50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <ImageIcon size={16} className="text-gray-500" />
              หลักฐานการโอน
            </h4>
          </div>
          <div className="flex flex-1 items-center justify-center bg-gray-100/50 p-6">
            {slipUrl ? (
              <div
                className="group relative cursor-pointer"
                onClick={() => setIsPreviewImageOpen(true)}
              >
                <img
                  src={slipUrl}
                  alt="Payment Slip"
                  className="max-h-100 max-w-full rounded-lg border border-gray-200 object-contain shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    กดเพื่อดูรูปใหญ่
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <ImageIcon size={24} className="opacity-50" />
                </div>
                <p className="text-sm">ไม่มีหลักฐานการโอน</p>
              </div>
            )}
          </div>

          {bill.payment && (
            <div className="space-y-2 border-t bg-white p-4 text-xs text-gray-500">
              <p>
                โอนเมื่อ:{" "}
                {bill.payment.createdAt
                  ? new Date(bill.payment.createdAt).toLocaleString("th-TH")
                  : "-"}
              </p>
              <p>สถานะ: {bill.payment.status}</p>
            </div>
          )}
        </div>
      </div>
      {isPreviewImageOpen && slipUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsPreviewImageOpen(false)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X size={32} />
          </button>
          <img
            src={slipUrl}
            alt="Slip Fullscreen"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
