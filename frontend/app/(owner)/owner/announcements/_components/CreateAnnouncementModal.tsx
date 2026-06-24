"use client";
import React, { useState } from "react";
import { X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";

interface CreateAnnouncementModalProps {
  onClose: () => void;
  dormitoryId: string;
}

export default function CreateAnnouncementModal({
  onClose,
  dormitoryId,
}: CreateAnnouncementModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "NORMAL",
    sendEmail: true,
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) return;

    const fd = new FormData();
    fd.append("dormitoryId", dormitoryId);
    fd.append("title", formData.title);
    fd.append("content", formData.content);
    fd.append("type", formData.type);
    fd.append("sendEmail", String(formData.sendEmail));

    // ดึงไฟล์จาก input
    const fileInput = document.getElementById("imageInput") as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      fd.append("image", fileInput.files[0]);
    }

    await AnnouncementService.createAnnouncement(fd);
    onClose();
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">สร้างประกาศใหม่</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex-1 space-y-5 overflow-y-auto border-b border-gray-100 p-4 sm:p-6 lg:border-r lg:border-b-0">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                หัวข้อประกาศ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น แจ้งงดจ่ายน้ำชั่วคราว"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ประเภท
                </label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="NORMAL">ทั่วไป (Normal)</option>
                  <option value="IMPORTANT">สำคัญ (Important)</option>
                  <option value="URGENT">ด่วน (Urgent)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  หอพักเป้าหมาย
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>ทุกหอพัก</option>
                  <option>ทดสอบ เพลส</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                รูปภาพแนบ (ถ้ามี)
              </label>
              <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:bg-gray-50">
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={handleImageChange}
                />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <ImageIcon size={28} className="text-blue-500" />
                  <span className="text-sm">คลิกหรือลากรูปภาพมาวางที่นี่</span>
                  <span className="text-xs text-gray-400">
                    รองรับ JPG, PNG ขนาดไม่เกิน 5MB
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                รายละเอียด <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="พิมพ์รายละเอียดประกาศที่นี่..."
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
              <input
                type="checkbox"
                id="sendEmail"
                checked={formData.sendEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sendEmail: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="sendEmail"
                className="cursor-pointer text-sm font-medium text-blue-900"
              >
                ส่งแจ้งเตือนเข้าอีเมลลูกบ้านทันที
              </label>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center bg-gray-50/80 p-4 sm:p-6 lg:overflow-y-auto">
            <div className="mb-4 w-full text-left text-xs font-semibold tracking-wider text-gray-400 uppercase lg:absolute lg:top-6 lg:left-6">
              Preview (มุมมองลูกบ้าน)
            </div>

            <div className="flex h-full max-h-[500px] w-full max-w-[340px] shrink-0 flex-col overflow-hidden rounded-[2rem] border-4 border-gray-200 bg-white shadow-xl lg:mt-8">
              <div className="shrink-0 bg-blue-600 p-4 text-center font-medium text-white shadow-sm">
                แจ้งเตือนประกาศ
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5 pb-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${formData.type === "URGENT" ? "bg-red-100 text-red-700" : formData.type === "IMPORTANT" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {formData.type === "URGENT" ? (
                      <AlertCircle size={12} />
                    ) : null}
                    {formData.type === "URGENT"
                      ? "ด่วนมาก"
                      : formData.type === "IMPORTANT"
                        ? "สำคัญ"
                        : "ประกาศทั่วไป"}
                  </span>
                  <span className="text-xs text-gray-400">เพิ่งจะโพสต์</span>
                </div>

                <h3 className="text-base font-bold break-all text-gray-900 sm:break-words">
                  {formData.title || "หัวข้อประกาศ..."}
                </h3>

                {previewImage && (
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="text-sm break-all whitespace-pre-wrap text-gray-600 sm:break-words">
                  {formData.content || "รายละเอียดประกาศจะแสดงที่นี่..."}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white p-4">
                <button className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">
                  รับทราบ / ปิดประกาศ
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50 p-4 sm:px-6">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            สร้างประกาศ
          </button>
        </div>
      </div>
    </div>
  );
}
