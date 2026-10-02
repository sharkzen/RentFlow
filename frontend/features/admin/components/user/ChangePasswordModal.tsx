"use client";
import React, { useRef, useState, RefObject } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { useOnClickOutside, useScrollLock } from "usehooks-ts";
import { toast } from "react-toastify";

import { AdminService } from "@/features/admin/services/admin.service";
import { isValidPassword } from "@/features/auth/validators/password";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userLabel: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userId,
  userLabel,
}: ChangePasswordModalProps) {
  useScrollLock();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref as RefObject<HTMLDivElement>, () => {
    if (!isSaving) onClose();
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPassword(password)) {
      setError(
        "รหัสผ่านต้องมีอย่างน้อย 6 ตัว เป็นตัวอักษรอังกฤษและตัวเลขเท่านั้น (ต้องมีทั้งตัวอักษรและตัวเลข)",
      );
      return;
    }

    if (password !== confirm) {
      setError("รหัสผ่านและการยืนยันไม่ตรงกัน");
      return;
    }

    try {
      setIsSaving(true);
      await AdminService.changeUserPassword(userId, password);
      toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      onClose();
    } catch {
      toast.error("ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        ref={ref}
        className="bg-surface ring-border w-full max-w-md rounded-xl p-6 shadow-2xl ring-1"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-blue-600" />
              เปลี่ยนรหัสผ่าน
            </h3>
            <p className="text-muted mt-1 text-sm break-all">{userLabel}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="bg-background text-muted hover:bg-border cursor-pointer rounded-full p-2 transition-colors"
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                autoFocus
                className="text-foreground ring-border block w-full rounded-lg border-0 py-2.5 pr-10 pl-3 ring-1 ring-inset focus:ring-2 focus:ring-blue-600 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="text-muted absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
                aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              className="text-foreground ring-border block w-full rounded-lg border-0 py-2.5 pr-3 pl-3 ring-1 ring-inset focus:ring-2 focus:ring-blue-600 sm:text-sm"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <p className="text-muted text-xs">
            การเปลี่ยนรหัสผ่านจะปลดล็อคบัญชีนี้ด้วย
            และผู้ใช้ต้องใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="border-border text-foreground hover:bg-background cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึกรหัสผ่านใหม่
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
