"use client";
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
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";
import { useScrollLock } from "usehooks-ts";
import { statusConfig } from "./RequestHistory";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";

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
  const { lock, unlock } = useScrollLock();

  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [existingImages, setExistingImages] = useState<
    MaintenanceRequest["images"]
  >([]);

  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) lock();
    else unlock();

    return () => unlock();
  }, [isOpen, lock, unlock]);

  useEffect(() => {
    if (isOpen && request) {
      setEditTitle(request.title);
      setEditDesc(request.description);
      setNewFiles([]);
      setExistingImages(request.images || []);
      setDeletedImageIds([]);
      setActionLoading(false);
      setIsEditing(false);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const canEditOrDelete = request.status === "OPEN";

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditOrDelete) return;

    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDesc);
      newFiles.forEach((file) => formData.append("images", file));
      deletedImageIds.forEach((id) => formData.append("deletedImageIds[]", id));
      await onSaveEdit(request.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);

    try {
      await onDelete(request.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
        <div
          className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300"
          onClick={onClose}
        />
        <div
          className="animate-in fade-in zoom-in-95 relative flex h-full w-full flex-col overflow-hidden bg-white duration-200 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-8">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {isEditing ? "แก้ไขข้อมูลแจ้งซ่อม" : "รายละเอียดแจ้งซ่อม"}
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto bg-white px-5 py-6 sm:px-8">
            {isEditing ? (
              <form id="edit-form" onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    หัวข้อปัญหา
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    รายละเอียด
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    รูปภาพเพิ่มเติม
                  </label>
                  <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:bg-slate-100">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) =>
                        e.target.files &&
                        setNewFiles((prev) => [
                          ...prev,
                          ...Array.from(e.target.files!),
                        ])
                      }
                    />
                    <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      แตะเพื่ออัปโหลดรูปภาพ
                    </p>
                  </div>
                </div>
                {(existingImages.length > 0 || newFiles.length > 0) && (
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"
                      >
                        <img
                          src={img.url}
                          className="h-full w-full object-cover"
                          alt="existing"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {newFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square overflow-hidden rounded-xl border-2 border-indigo-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          className="h-full w-full object-cover opacity-70"
                          alt="new"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div
                    className={`rounded-full px-4 py-1 text-xs font-bold ring-1 ${statusConfig[request.status].style}`}
                  >
                    {statusConfig[request.status].label}
                  </div>
                  <span className="text-xs text-slate-400">
                    แจ้งเมื่อ:{" "}
                    {format(new Date(request.createdAt), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    {request.title}
                  </h4>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-5 leading-relaxed whitespace-pre-line text-slate-700">
                    {request.description || (
                      <span className="text-slate-400 italic">
                        ไม่ได้ระบุรายละเอียด
                      </span>
                    )}
                  </div>
                </div>
                {request.images && request.images.length > 0 && (
                  <div>
                    <p className="mb-4 text-sm font-bold text-slate-900">
                      รูปภาพประกอบ ({request.images.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {request.images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(img.url)}
                          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200"
                        >
                          <img
                            src={img.url}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            alt="evidence"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <ZoomIn className="text-white" size={24} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-slate-100 bg-white p-5 sm:px-8">
            {!isEditing && (
              <div className="flex w-full items-center justify-between gap-3">
                {canEditOrDelete ? (
                  <>
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-50 px-6 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95"
                    >
                      <Trash2 size={18} />
                      ยกเลิกแจ้งซ่อม
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
                    >
                      <Edit2 size={18} />
                      แก้ไขข้อมูล
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-sm text-slate-400 italic">
                    รายการนี้อยู่ระหว่างดำเนินการหรือเสร็จสิ้นแล้ว
                    ไม่สามารถแก้ไขได้
                  </div>
                )}
              </div>
            )}
            {isEditing && (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="cursor-pointer rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={actionLoading}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}{" "}
                  บันทึกการแก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white">
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            className="animate-in zoom-in-95 max-h-full max-w-full object-contain duration-200"
            alt="full size"
          />
        </div>
      )}
      {isDeleteConfirmOpen && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="ยกเลิกรายการแจ้งซ่อม?"
          description="คุณแน่ใจหรือไม่ที่จะยกเลิกและลบรายการแจ้งซ่อมนี้? ข้อมูลและรูปภาพจะถูกลบออกจากระบบทันที"
          type="error"
          confirmText="ยืนยันยกเลิก"
          isLoading={actionLoading}
        />
      )}
    </>
  );
}
