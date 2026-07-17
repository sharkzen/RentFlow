"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";

interface AnnouncementEditModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnnouncementEditModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: AnnouncementEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("NORMAL");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(null);
  const [isConfirmDeleteImageOpen, setIsConfirmDeleteImageOpen] =
    useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;

    if (!el) return;

    if (isConfirmDeleteImageOpen) {
      el.style.overflow = "hidden";
    } else {
      el.style.overflow = "";
    }
  }, [isConfirmDeleteImageOpen]);

  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || "");
      setContent(item.content || "");
      setType(item.type || "NORMAL");
      setIsActive(item.isActive !== undefined ? item.isActive : true);
      setImageFile(null);

      if (item.images && item.images.length > 0 && item.images[0].url) {
        setPreviewImage(item.images[0].url);
        setExistingImageId(item.images[0].id);
      } else {
        setPreviewImage(null);
        setExistingImageId(null);
      }
    }
  }, [item, isOpen]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

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
      setExistingImageId(null);
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

  const handleRequestRemoveImage = () => {
    if (existingImageId) {
      setIsConfirmDeleteImageOpen(true);
    } else {
      setPreviewImage(null);
      setImageFile(null);
    }
  };

  const handleConfirmDeleteImage = async () => {
    if (!existingImageId) return;

    try {
      setIsDeletingImage(true);
      await AnnouncementService.deleteImage(existingImageId);
      toast.success("ลบรูปภาพเรียบร้อยแล้ว");
      setPreviewImage(null);
      setExistingImageId(null);
      setImageFile(null);
      setIsConfirmDeleteImageOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.warning("กรุณากรอกหัวข้อประกาศ");

    if (!content.trim()) return toast.warning("กรุณากรอกรายละเอียดประกาศ");

    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("type", type);
      fd.append("isActive", String(isActive));

      if (imageFile) {
        fd.append("image", imageFile);
      }

      await AnnouncementService.update(item.id, fd);
      toast.success("บันทึกการแก้ไขสำเร็จ");

      if (onSuccess) onSuccess();

      onClose();
    } catch (error: any) {
      console.error("Failed to update announcement:", error);
      toast.error(
        error.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <>
      <div className="fixed inset-0 z-[990] flex justify-center bg-black/50 transition-all sm:items-center sm:p-4">
        <div className="animate-in fade-in zoom-in-95 flex w-full max-w-3xl flex-col bg-white shadow-2xl duration-200 sm:max-h-[95vh] sm:rounded-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">แก้ไขประกาศ</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
          >
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <div>
                <p className="font-medium text-gray-900">แสดงประกาศนี้</p>
                <p className="text-sm text-gray-500">
                  ปิดการใช้งานเพื่อซ่อนประกาศชั่วคราวโดยไม่ต้องลบ
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isLoading}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white disabled:opacity-50"></div>
              </label>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  หัวข้อประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="หัวข้อประกาศ..."
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="sm:w-1/3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ประเภท
                </label>
                <select
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
                  รูปภาพประกอบ (กดที่รูปเพื่อเปลี่ยนรูปใหม่)
                </label>
                {previewImage && (
                  <button
                    onClick={handleRequestRemoveImage}
                    disabled={isLoading}
                    className="flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
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
                  id="editImageInput"
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
                      คลิกหรือลากรูปภาพใหม่มาวางที่นี่
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
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50 p-4 sm:px-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-5 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกการแก้ไข"
              )}
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmDeleteImageOpen}
        onClose={() => setIsConfirmDeleteImageOpen(false)}
        onConfirm={handleConfirmDeleteImage}
        isLoading={isDeletingImage}
        type="error"
        title="ยืนยันการลบรูปภาพ"
        description="คุณแน่ใจหรือไม่ที่จะลบรูปภาพประกอบนี้? รูปภาพจะถูกลบออกจากระบบทันทีและไม่สามารถกู้คืนได้"
        confirmText="ลบรูปภาพ"
        cancelText="ยกเลิก"
      />
    </>
  );
}
