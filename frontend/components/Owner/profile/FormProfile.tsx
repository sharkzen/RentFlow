"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  MessageCircle,
  Facebook,
  Edit2,
  Save,
  X,
  Info,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { OwnerService } from "@/features/owner/services/owner.service";
import log from "@/lib/logger";
import { OwnerProfile } from "@/features/owner/types";

export default function FormProfileColorful() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<OwnerProfile>({
    fullName: "",
    phone: "",
    lineId: "",
    facebook: "",
  });

  const [errors, setErrors] = useState<Partial<OwnerProfile>>({});

  const [originalData, setOriginalData] = useState(formData);

  const fetchProfile = async () => {
    try {
      setIsSaving(true);
      const data = await OwnerService.getOwnerProfile();

      const mappedData = {
        fullName: data.fullName || "",
        phone: data.phone || "",
        lineId: data.lineId || "",
        facebook: data.facebook || "",
      };
      setFormData(mappedData);
      setOriginalData(mappedData);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      log.error("Error fetching profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof OwnerProfile]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setErrors({});
    setIsEditing(false);
  };

  const validateForm = () => {
    const newErrors: Partial<OwnerProfile> = {};
    let isValid = true;

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
      isValid = false;
    }

    const phoneRegex = /^0[0-9]{8,9}$/;
    if (!formData.phone?.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
      isValid = false;
    } else if (!phoneRegex.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวเลข 9-10 หลัก)";
      isValid = false;
    }

    if (formData.lineId && formData.lineId.trim() !== "") {
      const lineValue = formData.lineId.trim();

      const hasThaiCharacter = /[\u0E00-\u0E7F]/.test(lineValue);

      const validLineFormat = /^[a-zA-Z0-9@._-]+$/;

      if (hasThaiCharacter) {
        newErrors.lineId =
          "Line ID ต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น (ห้ามมีภาษาไทย)";
        isValid = false;
      } else if (/\s/.test(lineValue)) {
        newErrors.lineId = "Line ID ห้ามมีการเว้นวรรค";
        isValid = false;
      } else if (!validLineFormat.test(lineValue)) {
        newErrors.lineId = "Line ID มีตัวอักษรที่ไม่ได้รับอนุญาต";
        isValid = false;
      }
    }

    if (formData.facebook && formData.facebook.trim() !== "") {
      try {
        new URL(formData.facebook);
        if (
          !formData.facebook.includes("facebook.com") &&
          !formData.facebook.includes("fb.me")
        ) {
          newErrors.facebook = "ลิงก์ต้องเป็นของ Facebook";
          isValid = false;
        }
      } catch (_) {
        newErrors.facebook =
          "รูปแบบลิงก์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("กรุณาตรวจสอบข้อมูลให้ถูกต้อง");
      return;
    }

    const hasChanges =
      formData.fullName !== originalData.fullName ||
      formData.phone !== originalData.phone ||
      formData.lineId !== originalData.lineId ||
      formData.facebook !== originalData.facebook;

    if (!hasChanges) {
      toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
      setIsEditing(false);
      return;
    }

    try {
      const updatedData = await toast.promise(
        OwnerService.updateOwnerProfile(formData),
        {
          pending: "กำลังบันทึกข้อมูลโปรไฟล์...",
          success: "บันทึกข้อมูลโปรไฟล์สำเร็จ",
          error: "เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้",
        },
      );

      setFormData({
        fullName: updatedData.fullName,
        phone: updatedData.phone,
        lineId: updatedData.lineId,
        facebook: updatedData.facebook,
      });

      setOriginalData({
        fullName: updatedData.fullName,
        phone: updatedData.phone,
        lineId: updatedData.lineId,
        facebook: updatedData.facebook,
      });

      setIsEditing(false);
    } catch (error: any) {
      log.error("Error updating profile:", error);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-100 bg-white font-sans shadow-sm">
      <div className="flex items-start gap-3 border-b border-indigo-100 bg-indigo-50 px-6 py-4">
        <div className="mt-0.5 rounded-full bg-indigo-100 p-2 text-indigo-600">
          <Info size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900">
            ข้อมูลส่วนตัวและช่องทางติดต่อ
          </h3>
          <p className="mt-0.5 text-sm text-indigo-600/80">
            ข้อมูลเหล่านี้จะถูกแสดงให้ผู้เช่าเห็นเพื่อให้ติดต่อคุณได้ง่ายขึ้น
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition-all hover:bg-indigo-500 hover:text-white"
          >
            <Edit2 size={16} />
            แก้ไขข้อมูล
          </button>
        )}
      </div>

      <div className="p-6 md:p-10">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
          <ColorInput
            label="ชื่อ-นามสกุล (เช่น สมชาย ใจดี (ชาย) )"
            name="fullName"
            value={formData.fullName}
            icon={User}
            theme="indigo"
            isEditing={isEditing}
            onChange={handleChange}
            required
            error={errors.fullName}
          />

          <ColorInput
            label="เบอร์โทรศัพท์"
            name="phone"
            value={formData.phone}
            icon={Phone}
            theme="orange"
            isEditing={isEditing}
            onChange={handleChange}
            required
            error={errors.phone}
          />

          <ColorInput
            label="Line ID"
            name="lineId"
            value={formData.lineId}
            icon={MessageCircle}
            theme="green"
            isEditing={isEditing}
            onChange={handleChange}
            placeholder="เช่น my.line.id"
            error={errors.lineId}
          />

          <ColorInput
            label="Facebook Link"
            name="facebook"
            value={formData.facebook}
            icon={Facebook}
            theme="blue"
            isEditing={isEditing}
            onChange={handleChange}
            isLink
            placeholder="https://facebook.com/..."
            error={errors.facebook}
          />
        </div>

        {isEditing && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-12 flex items-center justify-end gap-4 border-t border-slate-50 pt-6">
            <button
              onClick={handleCancel}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2.5 font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <X size={18} /> ยกเลิก
            </button>
            <button
              disabled={isSaving}
              onClick={handleSubmit}
              className={`${isSaving ? "pointer-events-none opacity-50" : ""} flex transform cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-8 py-2.5 font-medium text-white shadow-lg transition-all hover:shadow-indigo-500/30 active:scale-95`}
            >
              <Save size={18} /> บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const ColorInput = ({
  label,
  name,
  value,
  onChange,
  isEditing,
  icon: Icon,
  theme,
  isLink,
  placeholder,
  required,
  error,
}: any) => {
  const themeStyles: any = {
    indigo: {
      bg: "bg-indigo-100",
      text: "text-indigo-600",
      border: "focus:border-indigo-500",
      ring: "focus:ring-indigo-100",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      border: "focus:border-orange-500",
      ring: "focus:ring-orange-100",
    },
    green: {
      bg: "bg-emerald-100",
      text: "text-emerald-600",
      border: "focus:border-emerald-500",
      ring: "focus:ring-emerald-100",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "focus:border-blue-500",
      ring: "focus:ring-blue-100",
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.indigo;

  return (
    <div className="group">
      <label className="mb-2 ml-1 block text-xs font-semibold text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative flex items-center">
        <div
          className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 ${isEditing ? `${currentTheme.bg} ${currentTheme.text} shadow-sm` : "bg-slate-50 text-slate-400"} `}
        >
          <Icon size={20} strokeWidth={isEditing ? 2.5 : 2} />
        </div>

        <div className="relative flex-1">
          {isEditing ? (
            <>
              <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full rounded-lg border bg-slate-50 px-4 py-2.5 text-base text-slate-800 transition-all outline-none ${
                  error
                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : `border-slate-200 ${currentTheme.border} focus:ring-4 ${currentTheme.ring}`
                }`}
              />

              {error && (
                <div className="animate-in fade-in slide-in-from-top-1 absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 truncate px-2 py-2 text-base font-medium text-slate-700">
              {isLink && value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-blue-600 hover:underline"
                >
                  {value} <ExternalLink size={14} className="opacity-50" />
                </a>
              ) : (
                <span>{value || "-"}</span>
              )}

              {value && !isLink && (
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
