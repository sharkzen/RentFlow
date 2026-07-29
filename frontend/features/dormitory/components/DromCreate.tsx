"use client";
import { RefObject, useRef, useState } from "react";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendError";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Building2, X, Loader2, Home } from "lucide-react";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DormCreate({ onClose, onSuccess }: Props) {
  useScrollLock();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useOnClickOutside(ref as RefObject<HTMLElement>, () => {
    onClose();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warn("กรุณากรอกชื่อหอพัก");
      return;
    }

    try {
      setLoading(true);

      await toast.promise(DormService.createDrom(name.trim()), {
        pending: "กำลังสร้างระบบหอพัก...",
        success: "สร้างหอพักใหม่เรียบร้อย",
        error: "เกิดข้อผิดพลาดในการสร้างหอพัก",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pt-20 sm:items-center sm:pt-0">
      <div
        ref={ref}
        className="border-border bg-surface w-full max-w-md overflow-hidden rounded-lg border shadow-lg"
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Building2 size={18} />
            </div>
            <h2 className="text-foreground text-base font-semibold">
              สร้างหอพักใหม่
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:bg-background hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-foreground flex items-center gap-1 text-sm font-medium">
                ชื่อหอพัก <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Home size={16} />
                </div>
                <input
                  type="text"
                  placeholder="เช่น หอพักสุขใจ เรสซิเดนซ์"
                  value={name}
                  autoFocus
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border bg-surface text-foreground placeholder:text-muted disabled:bg-background disabled:text-muted w-full rounded-md border py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-muted mt-1.5 text-xs">
                คุณสามารถเพิ่มข้อมูลรายละเอียดอื่นๆ หลังจากสร้างหอพักสำเร็จ
              </p>
            </div>
          </div>
          <div className="border-border mt-8 flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border-border bg-surface text-foreground hover:bg-background cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex min-w-25 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "กำลังสร้าง..." : "ยืนยัน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
