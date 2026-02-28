"use client";
import { X, Keyboard, Camera, ChevronRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectScan: () => void;
}

export default function BillCreateOptionDialog({
  isOpen,
  onClose,
  onSelectManual,
  onSelectScan,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">เลือกวิธีสร้างบิล</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <button
            onClick={onSelectScan}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <Camera size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-indigo-900">สแกนมิเตอร์ (OCR)</h3>
                <p className="text-xs text-indigo-600/80">
                  เปิดกล้องสแกนค่าน้ำ/ไฟ ทีละห้อง
                </p>
              </div>
            </div>
            <ChevronRight className="text-indigo-400 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onSelectManual}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-gray-100 bg-white p-4 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Keyboard size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800">กรอกข้อมูลเอง</h3>
                <p className="text-xs text-gray-500">
                  พิมพ์ตัวเลขมิเตอร์ด้วยตัวเอง
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
