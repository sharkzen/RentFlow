"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendErrorMsg";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Building2, X } from "lucide-react";
import { useScrollLock } from "usehooks-ts";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DormCreate({ onClose, onSuccess }: Props) {
  useScrollLock();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn("กรุณากรอกชื่อหอพัก");
      return;
    }

    try {
      setLoading(true);

      await toast.promise(DormService.createDrom(name.trim()), {
        pending: "กำลังสร้างหอพักใหม่...",
        success: "สร้างหอพักใหม่เรียบร้อย",
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">สร้างหอพักใหม่</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">ชื่อหอพัก</label>
            <input
              type="text"
              placeholder="เช่น หอพักสุขใจ"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400">
              คุณสามารถแก้ไขรายละเอียดอื่น ๆ ได้หลังจากสร้างสำเร็จ
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "กำลังสร้าง..." : "สร้างหอพัก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
