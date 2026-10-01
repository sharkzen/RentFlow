"use client";
import React, { useState } from "react";
import { Lock, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { authService } from "@/features/auth/services/auth.service";
import { isValidPassword } from "@/features/auth/validators/password";
import { showBackendError } from "@/lib/backendError";
import log from "@/lib/logger";

type Fields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyFields: Fields = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [show, setShow] = useState<Record<keyof Fields, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof Fields]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Fields> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "กรุณากรอกรหัสผ่านเดิม";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
    } else if (!isValidPassword(formData.newPassword)) {
      newErrors.newPassword =
        "ต้องมีอย่างน้อย 6 ตัว เป็นตัวอักษรอังกฤษและตัวเลขเท่านั้น";
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม";
    }

    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "รหัสผ่านยืนยันไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("กรุณาตรวจสอบข้อมูลให้ถูกต้อง");
      return;
    }

    setIsSaving(true);

    try {
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword,
      );

      toast.success("เปลี่ยนรหัสผ่านเรียบร้อย");
      setFormData(emptyFields);
      setErrors({});
    } catch (error: any) {
      log.error("Error changing password:", error);
      toast.error(showBackendError(error?.response?.data?.message));
    } finally {
      setIsSaving(false);
    }
  };

  const fields: { name: keyof Fields; label: string; placeholder: string }[] = [
    {
      name: "currentPassword",
      label: "รหัสผ่านเดิม",
      placeholder: "กรอกรหัสผ่านเดิม",
    },
    {
      name: "newPassword",
      label: "รหัสผ่านใหม่",
      placeholder: "อย่างน้อย 6 ตัว (ตัวอักษร + ตัวเลข)",
    },
    {
      name: "confirmPassword",
      label: "ยืนยันรหัสผ่านใหม่",
      placeholder: "กรอกรหัสผ่านใหม่อีกครั้ง",
    },
  ];

  return (
    <div className="border-border bg-surface relative w-full overflow-hidden rounded-xl border">
      <div className="border-border bg-surface border-b p-4">
        <h3 className="text-foreground text-base font-semibold">
          เปลี่ยนรหัสผ่าน
        </h3>
        <p className="text-muted text-xs">
          กรอกรหัสผ่านเดิมและรหัสผ่านใหม่เพื่อเปลี่ยนรหัสผ่าน
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          {fields.map(({ name, label, placeholder }) => (
            <div key={name} className="group">
              <label className="text-foreground mb-1.5 block text-xs font-semibold">
                {label} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="text-muted pointer-events-none absolute top-3 left-3 h-4 w-4" />
                <input
                  type={show[name] ? "text" : "password"}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  disabled={isSaving}
                  autoComplete={
                    name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder={placeholder}
                  className={`border-border bg-surface text-foreground placeholder:text-muted h-10 w-full rounded-lg border px-3 pr-10 pl-10 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${errors[name] ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShow((prev) => ({ ...prev, [name]: !prev[name] }))}
                  className="text-muted hover:text-foreground absolute top-2.5 right-3 cursor-pointer"
                  aria-label={show[name] ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {show[name] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors[name] && (
                <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="border-border mt-10 flex items-center justify-end border-t pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </div>
      </form>
    </div>
  );
}
