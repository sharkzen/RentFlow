"use client";
import React, { useState, useRef, useEffect } from "react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { UploadCloud, Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { toast } from "react-toastify";

interface RequestFormProps {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const availableSlots = 2 - files.length;

      if (availableSlots <= 0) {
        toast.warn("คุณสามารถเลือกรูปภาพได้สูงสุด 2 รูป");
        return;
      }

      const filesToAdd = selectedFiles.slice(0, availableSlots);
      const newFiles = [...files, ...filesToAdd];
      setFiles(newFiles);
      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }

    if (e.target.value) e.target.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("กรุณาระบุหัวข้อปัญหา");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      files.forEach((file) => {
        formData.append("files", file);
      });

      await TenantService.createMaintenance(formData);
      toast.success("ส่งข้อมูลแจ้งซ่อมสำเร็จเรียบร้อยแล้ว");
      setTitle("");
      setDescription("");
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      setIsConfirmOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const serverMessage = error.response?.data?.message;
      let errorMessage = "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง";

      if (serverMessage === "Max 2 images allowed") {
        errorMessage = "อัปโหลดรูปภาพได้สูงสุด 2 รูปเท่านั้น";
      } else if (serverMessage === "Title is required") {
        errorMessage = "กรุณาระบุหัวข้อการแจ้งซ่อม";
      } else if (error.response?.status === 401) {
        errorMessage = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง";
      } else if (error.response?.status === 413) {
        errorMessage = "ขนาดไฟล์ใหญ่เกินไป กรุณาลดขนาดไฟล์ภาพ";
      }

      toast.error(errorMessage);
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handlePreSubmit}
        className="border-border bg-surface rounded-2xl border p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
              📝 รายละเอียดการแจ้งซ่อม
            </h3>
            <p className="text-muted mt-1 text-sm">
              กรุณาระบุข้อมูลให้ครบถ้วนเพื่อให้เจ้าหน้าที่ดำเนินการได้รวดเร็ว
            </p>
          </div>
          <hr className="border-border" />
          <div className="space-y-4">
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-semibold">
                หัวข้อปัญหา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น แอร์ไม่เย็น, ท่อน้ำรั่ว, ไฟดับ"
                className="border-border bg-background text-foreground placeholder:text-muted focus:bg-surface w-full rounded-xl border px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-semibold">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุอาการอย่างละเอียด หรือช่วงเวลาที่สะดวกให้เข้าซ่อม..."
                rows={4}
                className="border-border bg-background text-foreground placeholder:text-muted focus:bg-surface w-full resize-none rounded-xl border px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div>
            <label className="text-foreground mb-2 block text-sm font-semibold">
              รูปประกอบ (สูงสุด 2 รูป)
            </label>
            {files.length < 2 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-border bg-background group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="bg-surface mb-2 rounded-full p-3 shadow-sm transition-transform group-hover:scale-110">
                    <UploadCloud className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-muted mb-1 text-sm font-medium group-hover:text-blue-600">
                    คลิกเพื่ออัปโหลดรูปภาพ
                  </p>
                  <p className="text-muted text-xs">PNG, JPG (ไม่เกิน 2 รูป)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            )}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {previews.map((url, index) => (
                  <div
                    key={url}
                    className="border-border bg-surface relative aspect-square overflow-hidden rounded-xl border shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute top-2 right-2 z-10 cursor-pointer rounded-full bg-white/80 p-1.5 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                "ยืนยันแจ้งซ่อม"
              )}
            </button>
          </div>
        </div>
      </form>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันการแจ้งซ่อม"
        description="คุณตรวจสอบข้อมูลครบถ้วนแล้วใช่หรือไม่? เมื่อยืนยันแล้วเจ้าหน้าที่จะได้รับเรื่องทันที"
        type="warning"
        confirmText="ยืนยันส่งข้อมูล"
        cancelText="ตรวจสอบอีกครั้ง"
        isLoading={isSubmitting}
      />
    </>
  );
}
