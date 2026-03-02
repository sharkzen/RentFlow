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
      btnConfirm: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      icon: CheckCircle2,
    },

    warning: {
      bgIcon: "bg-amber-100",
      textIcon: "text-amber-600",
      btnConfirm: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
      icon: AlertTriangle,
    },

    error: {
      bgIcon: "bg-red-100",
      textIcon: "text-red-600",
      btnConfirm: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      icon: AlertCircle,
    },

    info: {
      bgIcon: "bg-blue-100",
      textIcon: "text-blue-600",
      btnConfirm: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: Info,
    },
  };

  const style = variants[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={!isLoading ? onClose : undefined}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
            <p className="mb-6 text-sm text-slate-500">{description}</p>
          )}
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 ${style.btnConfirm}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  กำลังดำเนินการ...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
