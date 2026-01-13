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
  Loader2,
  ExternalLink,
} from "lucide-react";

import { toast } from "react-toastify";
import { OwnerService } from "@/features/owner/services/owner.service";
import log from "@/lib/logger";
import { OwnerProfile } from "@/features/owner/types";

export default function FormProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/[^0-9-]/g, "");

      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name as keyof OwnerProfile]) {
      setErrors({
        ...errors,
        [name]: "",
      });
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
    const phoneClean = formData.phone?.replace(/-/g, "") || "";

    if (!formData.phone?.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
      isValid = false;
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง (9-10 หลัก)";
      isValid = false;
    }

    if (formData.lineId && formData.lineId.trim() !== "") {
      const lineValue = formData.lineId.trim();

      if (/[\u0E00-\u0E7F]/.test(lineValue)) {
        newErrors.lineId = "Line ID ต้องเป็นภาษาอังกฤษหรือตัวเลข";
        isValid = false;
      } else if (/\s/.test(lineValue)) {
        newErrors.lineId = "Line ID ห้ามมีเว้นวรรค";
        isValid = false;
      }
    }

    if (formData.facebook && formData.facebook.trim() !== "") {
      try {
        new URL(formData.facebook);

        if (
          !formData.facebook.toLowerCase().includes("facebook.com") &&
          !formData.facebook.toLowerCase().includes("fb.me")
        ) {
          newErrors.facebook = "ลิงก์ต้องเป็นของ Facebook เท่านั้น";
          isValid = false;
        }
      } catch (_) {
        newErrors.facebook =
          "รูปแบบลิงก์ไม่ถูกต้อง (ต้องมี http:// หรือ https://)";
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
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const updatedData = await toast.promise(
        OwnerService.updateOwnerProfile(formData),
        {
          pending: "กำลังบันทึก...",
          success: "บันทึกข้อมูลเรียบร้อย",
          error: "เกิดข้อผิดพลาดในการบันทึก",
        },
      );

      setFormData({
        fullName: updatedData.fullName,
        phone: updatedData.phone,
        lineId: updatedData.lineId,
        facebook: updatedData.facebook,
      });

      setOriginalData(formData);
      setIsEditing(false);
    } catch (error: any) {
      log.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputBaseClass =
    "w-full h-10 rounded-lg border px-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400";
  const editClass =
    "border-gray-300 bg-white text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
  const viewClass = "border-gray-200 bg-gray-50 text-gray-500 cursor-default";
  const iconClass = `absolute top-3 left-3 h-4 w-4 ${isEditing ? "text-gray-500" : "text-gray-400"} pointer-events-none transition-colors`;

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-gray-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            ข้อมูลส่วนตัว
          </h3>
          <p className="text-xs text-gray-500">
            ข้อมูลนี้จะแสดงให้ผู้เช่าเห็นเพื่อใช้ในการติดต่อ
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="group flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
          >
            <Edit2
              size={16}
              className="transition-transform group-hover:-rotate-12"
            />
            แก้ไขข้อมูล
          </button>
        )}
      </div>
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          <div className="group">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              ชื่อ-นามสกุล{" "}
              <span className="font-normal text-gray-400">(แสดงหน้าหอพัก)</span>{" "}
              {isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="ระบุชื่อ-นามสกุล"
                className={`${inputBaseClass} ${isEditing ? editClass : viewClass} ${errors.fullName ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>
          <div className="group">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              เบอร์โทรศัพท์{" "}
              {isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Phone className={iconClass} />
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                disabled={!isEditing}
                maxLength={10}
                placeholder="0xxxxxxxxx"
                className={`${inputBaseClass} ${isEditing ? editClass : viewClass} ${errors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>
          <div className="group">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Line ID
            </label>
            <div className="relative">
              <MessageCircle className={iconClass} />
              <input
                type="text"
                name="lineId"
                value={formData.lineId || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="ระบุ Line ID"
                className={`${inputBaseClass} ${isEditing ? editClass : viewClass} ${errors.lineId ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
            </div>
            {errors.lineId && (
              <p className="mt-1 text-xs text-red-500">{errors.lineId}</p>
            )}
          </div>
          <div className="group">
            <label className="mb-1.5 flex justify-between text-xs font-semibold text-gray-700">
              <span>Facebook Link</span>
              {!isEditing && formData.facebook && (
                <a
                  href={formData.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="flex cursor-pointer items-center text-blue-600 hover:underline"
                >
                  เปิดลิงก์ <ExternalLink size={10} className="ml-1" />
                </a>
              )}
            </label>
            <div className="relative">
              <Facebook className={iconClass} />
              <input
                type="text"
                name="facebook"
                value={formData.facebook || ""}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="https://facebook.com/..."
                className={`${inputBaseClass} ${isEditing ? editClass : viewClass} ${errors.facebook ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
              />
            </div>
            {errors.facebook && (
              <p className="mt-1 text-xs text-red-500">{errors.facebook}</p>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-10 flex items-center justify-end gap-3 border-t border-gray-50 pt-6 duration-300">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
