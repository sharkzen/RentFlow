"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { DormService } from "@/features/dormitory/services/dorm.service";

interface CreateAnnouncementModalProps {
  dormitoryId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateAnnouncementModal({
  dormitoryId,
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDorms, setIsLoadingDorms] = useState(true);
  const [dorms, setDorms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    dormitoryId: dormitoryId || "",
    title: "",
    content: "",
    type: "NORMAL",
    sendEmail: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        setIsLoadingDorms(true);
        const result = await DormService.getDorm();
        const dormList = Array.isArray(result) ? result : result?.data || [];
        setDorms(dormList);

        if (!dormitoryId && dormList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            dormitoryId: dormList[0].id,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dorms:", error);
        toast.error("ไม่สามารถดึงข้อมูลหอพักได้");
      } finally {
        setIsLoadingDorms(false);
      }
    };

    fetchDorms();
  }, [dormitoryId]);

  const handleInputChange = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.warning("ขนาดรูปภาพต้องไม่เกิน 5MB");
        e.target.value = "";
        return;
      }

      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewImage(url);

      setTimeout(() => {
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1200;
          const scale = img.width > MAX ? MAX / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas
            .getContext("2d")
            ?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPreviewImage(canvas.toDataURL("image/jpeg", 0.8));
        };

        img.src = url;
      }, 0);
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setPreviewImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);

      return null;
    });

    setImageFile(null);
    const fileInput = document.getElementById("imageInput") as HTMLInputElement;

    if (fileInput) fileInput.value = "";
  }, []);

  const handleSubmit = async () => {
    if (!formData.dormitoryId)
      return toast.warning("กรุณาเลือกหอพักที่ต้องการประกาศ");

    if (!formData.title.trim()) return toast.warning("กรุณากรอกหัวข้อประกาศ");

    if (!formData.content.trim())
      return toast.warning("กรุณากรอกรายละเอียดประกาศ");

    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("dormitoryId", formData.dormitoryId);
      fd.append("title", formData.title);
      fd.append("content", formData.content);
      fd.append("type", formData.type);
      fd.append("sendEmail", String(formData.sendEmail));

      if (imageFile) {
        fd.append("image", imageFile);
      }

      await AnnouncementService.createAnnouncement(fd);
      toast.success("สร้างประกาศสำเร็จ");

      if (onSuccess) onSuccess();

      onClose();
    } catch (error: any) {
      console.error("Failed to create announcement:", error);

      toast.error(
        error.response?.data?.error ||
          "เกิดข้อผิดพลาดในการสร้างประกาศ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex justify-center bg-black/50 transition-all sm:items-center sm:p-4">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-3xl flex-col bg-white shadow-2xl duration-200 sm:max-h-[95vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">สร้างประกาศใหม่</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              หัวข้อประกาศ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น แจ้งงดจ่ายน้ำชั่วคราว"
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                เลือกหอพัก <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isLoading || isLoadingDorms}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
                value={formData.dormitoryId}
                onChange={(e) =>
                  handleInputChange("dormitoryId", e.target.value)
                }
              >
                {isLoadingDorms ? (
                  <option value="">กำลังโหลดข้อมูล...</option>
                ) : dorms.length === 0 ? (
                  <option value="">ไม่พบข้อมูลหอพักของคุณ</option>
                ) : (
                  <>
                    <option value="ALL">ทุกหอพัก</option>
                    {dorms.map((dorm: any) => (
                      <option key={dorm.id} value={dorm.id}>
                        {dorm.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ประเภท
              </label>
              <select
                disabled={isLoading}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
              >
                <option value="NORMAL">ทั่วไป (Normal)</option>
                <option value="IMPORTANT">สำคัญ (Important)</option>
                <option value="URGENT">ด่วน (Urgent)</option>
              </select>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                รูปภาพแนบ (ถ้ามี)
              </label>
              {previewImage && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  ลบรูปภาพ
                </button>
              )}
            </div>
            <div
              className={`relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 text-center transition-colors hover:border-gray-300 hover:bg-gray-50 ${isLoading ? "pointer-events-none opacity-50" : ""} ${previewImage ? "border-blue-200 bg-gray-50" : "p-6"}`}
            >
              <input
                id="imageInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                disabled={isLoading}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                onChange={handleImageChange}
              />
              {previewImage ? (
                <div className="group relative flex aspect-4/3 w-full items-center justify-center bg-gray-50">
                  <img
                    src={previewImage}
                    alt="Preview"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
                      <ImageIcon size={16} />
                      คลิกเพื่อเปลี่ยนรูปภาพ
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="mb-1 rounded-full bg-blue-50 p-3 text-blue-500">
                    <ImageIcon size={28} />
                  </div>
                  <span className="text-sm font-medium">
                    คลิกหรือลากรูปภาพมาวางที่นี่
                  </span>
                  <span className="text-xs text-gray-400">
                    รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              รายละเอียด <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              disabled={isLoading}
              placeholder="พิมพ์รายละเอียดประกาศที่นี่..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <input
              type="checkbox"
              id="sendEmail"
              disabled={isLoading}
              checked={formData.sendEmail}
              onChange={(e) => handleInputChange("sendEmail", e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <label
              htmlFor="sendEmail"
              className={`text-sm font-medium text-blue-900 ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              ส่งแจ้งเตือนเข้าอีเมลลูกบ้านทันที
            </label>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50 p-4 sm:px-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-5 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingDorms}
            className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              "สร้างประกาศ"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
