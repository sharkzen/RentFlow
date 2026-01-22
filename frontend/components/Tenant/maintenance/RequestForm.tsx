import React, { useState, useRef } from "react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { UploadCloud, X, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface RequestFormProps {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = [...files, ...selectedFiles].slice(0, 2);
      setFiles(totalFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

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
      setTitle("");
      setDescription("");
      setFiles([]);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setIsConfirmOpen(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handlePreSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              📝 รายละเอียดการแจ้งซ่อม
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              กรุณาระบุข้อมูลให้ครบถ้วนเพื่อให้เจ้าหน้าที่ดำเนินการได้รวดเร็ว
            </p>
          </div>
          <hr className="border-gray-100" />
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                หัวข้อปัญหา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น แอร์ไม่เย็น, ท่อน้ำรั่ว, ไฟดับ"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุอาการอย่างละเอียด หรือช่วงเวลาที่สะดวกให้เข้าซ่อม..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              รูปประกอบ (สูงสุด 2 รูป)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="mb-2 rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-110">
                  <UploadCloud className="h-6 w-6 text-blue-500" />
                </div>
                <p className="mb-1 text-sm font-medium text-gray-500 group-hover:text-blue-600">
                  คลิกเพื่ออัปโหลดรูปภาพ
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG (ไม่เกิน 2 รูป)
                </p>
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
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="rounded-full bg-white/90 p-1.5 text-red-500 transition-colors hover:bg-white hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30 active:scale-[0.99]"
            >
              ยืนยันแจ้งซ่อม
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
