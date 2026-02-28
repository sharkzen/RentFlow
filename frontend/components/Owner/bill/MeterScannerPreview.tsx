"use client";
import { useState, useEffect } from "react";
import {
  X,
  Save,
  Image as ImageIcon,
  Droplets,
  Zap,
  Camera,
  Loader2,
} from "lucide-react";
import MonthYearPicker from "./MonthYearPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scannedData: any[];
  onSubmit: (data: any) => Promise<void>;
  dormName: string;
  onRetake: (roomId: string, type: "WATER" | "ELECTRIC") => void;
}

export default function MeterScannerPreview({
  isOpen,
  onClose,
  scannedData,
  onSubmit,
  dormName,
  onRetake,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scannedData.length > 0) {
      setItems(scannedData);
      setSelectedDate(new Date());
    }
  }, [isOpen, scannedData]);

  const handleChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const payload = {
      billingMonth: selectedDate,

      items: items.map((i) => ({
        roomId: i.roomId,
        prevWater: Number(i.prevWater),
        currentWater: Number(i.currentWater),
        waterImage: i.waterImage,
        prevElectric: Number(i.prevElectric),
        currentElectric: Number(i.currentElectric),
        electricImage: i.electricImage,
        commonFee: Number(i.commonFee),
      })),
    };

    setIsSubmitting(true);
    await onSubmit(payload);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 md:items-center md:justify-center md:bg-black/40 md:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50 shadow-2xl md:max-h-[90vh] md:max-w-4xl md:rounded-2xl md:bg-white">
        <div className="z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm md:border-b md:px-6 md:shadow-none">
          <div>
            <h2 className="text-xl font-bold text-gray-800">สรุปข้อมูลสแกน</h2>
            <p className="text-sm text-gray-500">{dormName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="z-10 bg-white px-4 py-3 shadow-sm md:px-6">
          <MonthYearPicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-4 md:p-6">
          {items.map((item, idx) => (
            <div
              key={item.roomId}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h3 className="mb-3 border-b border-gray-100 pb-2 text-lg font-extrabold text-indigo-700">
                ห้อง {item.roomNumber}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-blue-800">
                      <Droplets size={18} />
                      มิเตอร์น้ำ
                    </span>
                    <button
                      onClick={() => onRetake(item.roomId, "WATER")}
                      className="flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 active:scale-95"
                    >
                      <Camera size={14} />
                      ถ่ายใหม่
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div
                      className="group relative flex h-20 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:scale-105"
                      onClick={() =>
                        item.waterImage && setPreviewImageUrl(item.waterImage)
                      }
                    >
                      {item.waterImage ? (
                        <>
                          <img
                            src={item.waterImage}
                            alt="Water Meter"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-xs font-bold text-white shadow-sm">
                              ดูรูปเต็ม
                            </span>
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={24} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-1 text-xs text-gray-500">
                        ครั้งก่อน: {item.prevWater}
                      </div>
                      <input
                        type="number"
                        placeholder="เลขปัจจุบัน"
                        className="w-full rounded-lg border border-gray-300 p-2 text-lg font-bold text-gray-800 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        value={item.currentWater}
                        onChange={(e) =>
                          handleChange(idx, "currentWater", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-100 bg-yellow-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-yellow-800">
                      <Zap size={18} />
                      มิเตอร์ไฟ
                    </span>
                    <button
                      onClick={() => onRetake(item.roomId, "ELECTRIC")}
                      className="flex items-center gap-1 rounded border border-yellow-200 bg-white px-2 py-1 text-xs font-semibold text-yellow-600 shadow-sm transition-colors hover:bg-yellow-50 active:scale-95"
                    >
                      <Camera size={14} />
                      ถ่ายใหม่
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div
                      className="group relative flex h-20 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:scale-105"
                      onClick={() =>
                        item.electricImage &&
                        setPreviewImageUrl(item.electricImage)
                      }
                    >
                      {item.electricImage ? (
                        <>
                          <img
                            src={item.electricImage}
                            alt="Electric Meter"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-xs font-bold text-white shadow-sm">
                              ดูรูปเต็ม
                            </span>
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={24} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-1 text-xs text-gray-500">
                        ครั้งก่อน: {item.prevElectric}
                      </div>
                      <input
                        type="number"
                        placeholder="เลขปัจจุบัน"
                        className="w-full rounded-lg border border-gray-300 p-2 text-lg font-bold text-gray-800 transition-all outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                        value={item.currentElectric}
                        onChange={(e) =>
                          handleChange(idx, "currentElectric", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:px-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-200 active:scale-95"
            >
              กลับไปกล้อง
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition-colors hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันและสร้างบิล"}
            </button>
          </div>
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            onClick={() => setPreviewImageUrl(null)}
          >
            <X size={28} />
          </button>
          <img
            src={previewImageUrl}
            alt="Full Preview"
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
