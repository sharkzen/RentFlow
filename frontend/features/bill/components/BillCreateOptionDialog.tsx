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
      <div className="bg-surface w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-bold">
            เลือกวิธีสร้างบิล
          </h2>
          <button
            onClick={onClose}
            className="bg-background text-muted hover:bg-border/40 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <button
            onClick={onSelectScan}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md active:scale-95 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <Camera size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300">
                  สแกนมิเตอร์ (OCR)
                </h3>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                  เปิดกล้องสแกนค่าน้ำ/ไฟ ทีละห้อง
                </p>
              </div>
            </div>
            <ChevronRight className="text-indigo-400 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={onSelectManual}
            className="group border-border bg-surface hover:bg-background flex w-full cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="bg-background text-muted flex h-12 w-12 items-center justify-center rounded-full">
                <Keyboard size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-foreground font-bold">กรอกข้อมูลเอง</h3>
                <p className="text-muted text-xs">
                  พิมพ์ตัวเลขมิเตอร์ด้วยตัวเอง
                </p>
              </div>
            </div>
            <ChevronRight className="text-muted transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
