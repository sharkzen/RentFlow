import React, { useState, useEffect } from "react";
import { MaintenanceRequest } from "@/features/tenant";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import {
  X,
  Edit2,
  Trash2,
  UploadCloud,
  Loader2,
  AlertCircle,
  Wrench,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";

import { useScrollLock } from "usehooks-ts";

const statusConfig = {
  OPEN: {
    label: "รอรับเรื่อง",
    style: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: AlertCircle,
  },

  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Wrench,
  },

  COMPLETED: {
    label: "เสร็จสิ้น",
    style: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },

  CANCELLED: {
    label: "ยกเลิก",
    style: "bg-gray-50 text-gray-600 border-gray-200",
    icon: XCircle,
  },
};

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
  onSaveEdit: (id: string, formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function MaintenanceDetailModal({
  isOpen,
  onClose,
  request,
  onSaveEdit,
  onDelete,
}: MaintenanceDetailModalProps) {
  useScrollLock();
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [existingImages, setExistingImages] = useState<
    MaintenanceRequest["images"]
  >([]);

  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && request) {
      if (!isEditing) {
        setEditTitle(request.title);
        setEditDesc(request.description);
      }

      setNewFiles([]);
      setExistingImages(request.images || []);
      setDeletedImageIds([]);
      setActionLoading(false);
    }
  }, [isOpen, request, isEditing]);

  useEffect(() => {
    if (isOpen) setIsEditing(false);
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const StatusIcon = statusConfig[request.status].icon;

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDesc);
      newFiles.forEach((file) => formData.append("images", file));
      deletedImageIds.forEach((id) => formData.append("deletedImageIds[]", id));
      await onSaveEdit(request.id, formData);
      setIsEditing(false);
      setNewFiles([]);
      setDeletedImageIds([]);
    } catch (error) {
      console.error("Update failed within modal:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกรายการนี้?")) return;

    setActionLoading(true);

    try {
      await onDelete(request.id);
      onClose();
    } catch (error) {
      console.error("Delete failed within modal:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300">
        <div
          className="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-white/50 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? "แก้ไขข้อมูลแจ้งซ่อม" : "รายละเอียดแจ้งซ่อม"}
            </h3>
            <button
              onClick={onClose}
              className="group cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <form id="edit-form" onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    หัวข้อปัญหา
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    อัปโหลดรูปเพิ่มเติม
                  </label>
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) => {
                        if (e.target.files)
                          setNewFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files!),
                          ]);
                      }}
                    />
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-gray-100">
                        <UploadCloud className="h-6 w-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        คลิกเพื่อเพิ่มรูปภาพ
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG ขนาดไม่เกิน 5MB
                      </p>
                    </div>
                  </div>
                </div>
                {(existingImages.length > 0 || newFiles.length > 0) && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      รูปภาพ ({existingImages.length + newFiles.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                          <img
                            src={img.url}
                            className="h-full w-full object-cover"
                            alt="existing"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img.id)}
                            className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-600 opacity-90 shadow-sm transition-all hover:scale-110 hover:bg-red-600 hover:text-white hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {newFiles.map((file, index) => (
                        <div
                          key={`new-${index}`}
                          className="group relative h-20 w-20 overflow-hidden rounded-lg border border-blue-200 bg-blue-50 shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            className="h-full w-full object-cover opacity-90"
                            alt="new"
                            onLoad={(e) =>
                              URL.revokeObjectURL(e.currentTarget.src)
                            }
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-[10px] font-bold text-white drop-shadow-md">
                              NEW
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(index)}
                            className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-600 opacity-90 shadow-sm transition-all hover:scale-110 hover:bg-red-600 hover:text-white hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm ${statusConfig[request.status].style}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {statusConfig[request.status].label}
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    แจ้งเมื่อ:{" "}
                    {format(new Date(request.createdAt), "d MMM yy • HH:mm", {
                      locale: th,
                    })}{" "}
                    น.
                  </span>
                </div>
                <div>
                  <h4 className="text-xl leading-tight font-bold text-gray-900">
                    {request.title}
                  </h4>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">
                      {request.description || (
                        <span className="text-gray-400 italic">
                          ไม่ได้ระบุรายละเอียดเพิ่มเติม
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {request.images && request.images.length > 0 && (
                  <div>
                    <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                      หลักฐานรูปภาพ
                    </h5>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {request.images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(img.url)}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-blue-400"
                        >
                          <img
                            src={img.url}
                            alt="evidence"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 backdrop-blur-sm">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                  disabled={actionLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={actionLoading}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-70"
                >
                  {actionLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </>
            ) : (
              <>
                {request.status === "OPEN" ? (
                  <>
                    <button
                      onClick={handleDeleteClick}
                      disabled={actionLoading}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      ยกเลิกแจ้งซ่อม
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                    >
                      <Edit2 className="h-4 w-4" />
                      แก้ไขข้อมูล
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 sm:w-auto"
                  >
                    ปิดหน้าต่าง
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {selectedImage && (
        <div
          className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4 duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            className="animate-in zoom-in-95 max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
