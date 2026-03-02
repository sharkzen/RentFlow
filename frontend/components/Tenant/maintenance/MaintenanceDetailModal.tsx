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
} from "lucide-react";
import { useScrollLock } from "usehooks-ts";
import { statusConfig } from "./RequestHistory";

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
  const canEditOrDelete = request.status === "OPEN";

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
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
      setNewFiles([]);
      setDeletedImageIds([]);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!canEditOrDelete) return;

    if (!confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกรายการแจ้งซ่อมนี้?")) return;

    setActionLoading(true);

    try {
      await onDelete(request.id);
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 transition-opacity duration-300 sm:items-center sm:p-4">
        <div
          className="animate-in slide-in-from-bottom-full sm:zoom-in-95 relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl duration-300 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-8 sm:py-5">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {isEditing ? "แก้ไขข้อมูลแจ้งซ่อม" : "รายละเอียดแจ้งซ่อม"}
            </h3>
            <button
              onClick={onClose}
              className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-50 transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </button>
          </div>

          <div className="scrollbar-thin scrollbar-thumb-slate-200 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {isEditing && canEditOrDelete ? (
              <form
                id="edit-form"
                onSubmit={handleSave}
                className="mx-auto max-w-xl space-y-6"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    หัวข้อปัญหา <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    อัปโหลดรูปเพิ่มเติม
                  </label>
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-300 hover:bg-slate-100">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      onChange={(e) => {
                        if (e.target.files)
                          setNewFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files!),
                          ]);
                      }}
                    />
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <UploadCloud className="h-8 w-8 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        แตะเพื่อเพิ่มรูปภาพ
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        รองรับ JPG, PNG สูงสุด 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {(existingImages.length > 0 || newFiles.length > 0) && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <p className="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      รูปที่แนบไว้ ({existingImages.length + newFiles.length})
                    </p>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                        >
                          <img
                            src={img.url}
                            className="h-full w-full object-cover"
                            alt="existing"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img.id)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-rose-500 text-white opacity-90 shadow-sm transition-all hover:scale-110 hover:opacity-100 sm:h-7 sm:w-7"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      ))}
                      {newFiles.map((file, index) => (
                        <div
                          key={`new-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-xl border-2 border-indigo-200 shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            className="h-full w-full object-cover opacity-80"
                            alt="new"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/20">
                            <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              NEW
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(index)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-rose-500 text-white opacity-90 shadow-sm transition-all hover:scale-110 hover:opacity-100 sm:h-7 sm:w-7"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="mx-auto max-w-xl space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${statusConfig[request.status].style}`}
                  >
                    <StatusIcon size={16} strokeWidth={2.5} />
                    {statusConfig[request.status].label}
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    แจ้งเมื่อ:{" "}
                    {format(new Date(request.createdAt), "d MMM yy • HH:mm", {
                      locale: th,
                    })}{" "}
                    น.
                  </span>
                </div>

                <div>
                  <h4 className="text-2xl leading-tight font-bold text-slate-900">
                    {request.title}
                  </h4>
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:p-6">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 sm:text-base">
                      {request.description || (
                        <span className="text-slate-400 italic">
                          ไม่ได้ระบุรายละเอียดเพิ่มเติม...
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {request.images && request.images.length > 0 && (
                  <div>
                    <h5 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <ImageIcon className="h-5 w-5 text-indigo-500" />{" "}
                      รูปภาพแนบ
                    </h5>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                      {request.images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(img.url)}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-indigo-400"
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

          <div className="pb-safe mt-auto shrink-0 border-t border-slate-100 bg-white p-5 sm:bg-slate-50 sm:px-8 sm:py-5">
            <div className="mx-auto flex max-w-xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {isEditing && canEditOrDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={actionLoading}
                    className="w-full cursor-pointer rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 sm:w-auto sm:py-3"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    form="edit-form"
                    disabled={actionLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-70 sm:w-auto sm:py-3"
                  >
                    {actionLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    บันทึกการแก้ไข
                  </button>
                </>
              ) : (
                <>
                  {canEditOrDelete ? (
                    <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
                      <button
                        onClick={handleDeleteClick}
                        disabled={actionLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-3.5 text-sm font-bold text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-100 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-3"
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
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 sm:w-auto sm:py-3"
                      >
                        <Edit2 className="h-4 w-4" />
                        แก้ไขข้อมูล
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onClose}
                      className="w-full cursor-pointer rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 sm:w-auto sm:py-3"
                    >
                      ปิดหน้าต่าง
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-2 duration-200 sm:p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:top-6 sm:right-6">
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            className="animate-in zoom-in-95 max-h-dvh w-full object-contain shadow-2xl duration-200 sm:max-h-[90vh] sm:max-w-[90vw] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            alt="Full size evidence"
          />
        </div>
      )}
    </>
  );
}
