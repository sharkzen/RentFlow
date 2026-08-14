"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Image as ImageIcon,
  Loader2,
  Trash2,
  ExternalLink,
  Building2,
  Megaphone,
} from "lucide-react";
import { toast } from "react-toastify";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { CustomSelect } from "@/lib/ui/CustomSelect";

const TYPE_OPTIONS = [
  {
    value: "NORMAL",
    label: "ทั่วไป (Normal)",
  },
  {
    value: "IMPORTANT",
    label: "สำคัญ (Important)",
  },
  {
    value: "URGENT",
    label: "ด่วน (Urgent)",
  },
];

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [],
  );

  const handleRemoveImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

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
      <div className="bg-surface animate-in fade-in zoom-in-95 flex w-full max-w-3xl flex-col shadow-2xl duration-200 sm:max-h-[95vh] sm:rounded-2xl">
        <div className="border-border flex shrink-0 items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-foreground text-xl font-bold">สร้างประกาศใหม่</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-background text-muted hover:bg-border hover:text-foreground cursor-pointer rounded-full p-2 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              หัวข้อประกาศ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น แจ้งงดจ่ายน้ำชั่วคราว"
              disabled={isLoading}
              className="border-border disabled:bg-background w-full rounded-xl border px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="text-foreground mb-1 block text-sm font-medium">
                เลือกหอพัก <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                icon={<Building2 size={16} />}
                disabled={isLoading || isLoadingDorms}
                placeholder={
                  isLoadingDorms
                    ? "กำลังโหลดข้อมูล..."
                    : "ไม่พบข้อมูลหอพักของคุณ"
                }
                options={
                  isLoadingDorms
                    ? []
                    : [
                        {
                          value: "ALL",
                          label: "ทุกหอพัก",
                        },
                        ...dorms.map((dorm: any) => ({
                          value: dorm.id,
                          label: dorm.name,
                        })),
                      ]
                }
                value={formData.dormitoryId}
                onChange={(val) => handleInputChange("dormitoryId", val)}
              />
            </div>
            <div className="flex-1">
              <label className="text-foreground mb-1 block text-sm font-medium">
                ประเภท
              </label>
              <CustomSelect
                icon={<Megaphone size={16} />}
                disabled={isLoading}
                options={TYPE_OPTIONS}
                value={formData.type}
                onChange={(val) => handleInputChange("type", val)}
              />
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              รูปภาพแนบ (ถ้ามี)
            </label>
            {previewImage ? (
              <div className="border-border bg-background flex items-start gap-4 rounded-xl border p-4">
                <div className="group border-border bg-surface relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-sm">
                  <img
                    src={previewImage}
                    alt="Preview Thumbnail"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-foreground line-clamp-1 max-w-[200px] text-sm font-medium sm:max-w-xs">
                    {imageFile?.name || "รูปภาพแนบ"}
                  </span>
                  <span className="text-muted text-xs">
                    ขนาด:{" "}
                    {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 0}{" "}
                    MB
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isLoading}
                    className="mt-1 flex w-fit items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    ลบรูปภาพและเลือกใหม่
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`border-border hover:bg-background hover:border-muted relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  id="imageInput"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  disabled={isLoading}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  onChange={handleImageChange}
                />
                <div className="text-muted flex flex-col items-center gap-2">
                  <div className="mb-1 rounded-full bg-blue-50 p-3 text-blue-500">
                    <ImageIcon size={28} />
                  </div>
                  <span className="text-sm font-medium">
                    คลิกหรือลากรูปภาพมาวางที่นี่
                  </span>
                  <span className="text-muted text-xs">
                    รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              รายละเอียด <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              disabled={isLoading}
              placeholder="พิมพ์รายละเอียดประกาศที่นี่..."
              className="border-border disabled:bg-background w-full resize-none rounded-xl border px-4 py-3 transition-all outline-none focus:border-blue-500 focus:border-transparent focus:ring-4 focus:ring-blue-500/10"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:bg-blue-50/10">
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
              className={`text-sm font-medium text-blue-900 dark:text-white ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              ส่งแจ้งเตือนเข้าอีเมลลูกบ้านทันที
            </label>
          </div>
        </div>
        <div className="border-border bg-background/50 flex shrink-0 justify-end gap-3 rounded-b-2xl border-t p-4 sm:px-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted hover:bg-border rounded-xl px-5 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
