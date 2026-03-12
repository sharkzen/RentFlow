"use client";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { useEffect } from "react";
export type ConfirmDialogType = "success" | "warning" | "error" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  inputPlaceholder?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = "warning",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  isLoading = false,
  showInput = false,
  inputValue = "",
  onInputChange,
  inputPlaceholder = "ระบุหมายเหตุเพิ่มเติม...",
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variants = {
    success: {
      bgIcon: "bg-green-100",
      textIcon: "text-green-600",
      btnConfirm: "bg-green-600 hover:bg-green-700",
      icon: CheckCircle2,
    },

    warning: {
      bgIcon: "bg-amber-100",
      textIcon: "text-amber-600",
      btnConfirm: "bg-amber-600 hover:bg-amber-700",
      icon: AlertTriangle,
    },

    error: {
      bgIcon: "bg-red-100",
      textIcon: "text-red-600",
      btnConfirm: "bg-red-600 hover:bg-red-700",
      icon: AlertCircle,
    },

    info: {
      bgIcon: "bg-blue-100",
      textIcon: "text-blue-600",
      btnConfirm: "bg-blue-600 hover:bg-blue-700",
      icon: Info,
    },
  };

  const style = variants[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        )}
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 rounded-full p-3 ${style.bgIcon}`}>
            <Icon className={`h-8 w-8 ${style.textIcon}`} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="mb-4 text-sm text-slate-500">{description}</p>
          )}

          {showInput && (
            <div className="mb-6 w-full text-left">
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                autoFocus
              />
            </div>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-70 ${style.btnConfirm}`}
            >
              {isLoading ? "กำลังดำเนินการ..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
