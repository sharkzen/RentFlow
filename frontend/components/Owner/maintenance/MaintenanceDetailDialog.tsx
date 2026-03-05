"use client";
import {
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ImageIcon,
  FileText,
  Building,
  X,
  UserPlus,
  ZoomIn,
} from "lucide-react";

import { MaintenanceRequest, MaintenanceStatus } from "@/features/maintenance";
import { useEffect, useState } from "react";
import { useScrollLock } from "usehooks-ts";
import ConfirmDialog, {
  ConfirmDialogType,
} from "@/components/ui/ConfirmDialog";

interface MaintenanceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: MaintenanceRequest | null;
  onUpdateStatus: (id: string, newStatus: MaintenanceStatus) => void;
  isLoading?: boolean;
}

export default function MaintenanceDetailDialog({
  isOpen,
  onClose,
  data,
  onUpdateStatus,
  isLoading = false,
}: MaintenanceDetailDialogProps) {
  const { lock, unlock } = useScrollLock();

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    newStatus: MaintenanceStatus | null;
    title: string;
    description: string;
    type: ConfirmDialogType;
  }>({
    isOpen: false,
    newStatus: null,
    title: "",
    description: "",
    type: "warning",
  });

  useEffect(() => {
    if (isOpen) lock();
    else unlock();

    return () => unlock();
  }, [isOpen, lock, unlock]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (selectedImageUrl) {
        setSelectedImageUrl(null);
      } else if (confirmConfig.isOpen) {
        setConfirmConfig((prev) => ({
          ...prev,
          isOpen: false,
        }));
      } else if (isOpen && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, selectedImageUrl, confirmConfig.isOpen]);

  if (!isOpen || !data) return null;

  const triggerUpdateStatus = (newStatus: MaintenanceStatus) => {
    let config: any = {
      isOpen: true,
      newStatus,
    };

    switch (newStatus) {
      case "CANCELLED":
        config = {
          ...config,
          title: "ยืนยันการยกเลิกรายการ?",
          description:
            "คุณต้องการยกเลิกรายการแจ้งซ่อมนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
          type: "error",
        };

        break;
      case "IN_PROGRESS":
        config = {
          ...config,
          title: "เริ่มดำเนินการซ่อม?",
          description: "ยืนยันการรับเรื่องและเริ่มดำเนินการซ่อมสำหรับรายการนี้",
          type: "info",
        };

        break;
      case "COMPLETED":
        config = {
          ...config,
          title: "ยืนยันการปิดงาน?",
          description: "คุณได้ดำเนินการซ่อมแซมเสร็จสิ้นแล้วใช่หรือไม่?",
          type: "success",
        };

        break;
    }

    setConfirmConfig(config);
  };

  const handleConfirmUpdate = () => {
    if (confirmConfig.newStatus && data) {
      onUpdateStatus(data.id, confirmConfig.newStatus);

      setConfirmConfig((prev) => ({
        ...prev,
        isOpen: false,
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case "OPEN":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          label: "รอรับเรื่อง",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          label: "กำลังดำเนินการ",
        };
      case "COMPLETED":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          label: "เสร็จสิ้น",
        };
      case "CANCELLED":
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
          label: "ยกเลิก",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
          label: status,
        };
    }
  };

  const statusStyle = getStatusColor(data.status);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
        <div
          className="fixed inset-0 bg-black/60 transition-opacity duration-300"
          onClick={onClose}
        />
        <div className="animate-in fade-in zoom-in-95 relative flex max-h-screen w-full max-w-3xl flex-col overflow-hidden bg-white ring-1 ring-gray-900/5 duration-200 sm:max-h-[90vh] sm:rounded-2xl">
          <div className="flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5 sm:px-8">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {statusStyle.label}
                </div>
                <span className="font-mono text-sm tracking-wide text-gray-400">
                  #{data.id.split("-")[0]}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                {data.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto bg-white px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-8">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FileText size={18} className="text-indigo-600" />
                  รายละเอียด
                </div>
                <p className="text-base leading-relaxed text-gray-600">
                  {data.description || "- ไม่มีรายละเอียดเพิ่มเติม -"}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-200">
                  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900">
                    <Building size={20} className="text-indigo-600" />{" "}
                    ข้อมูลพื้นที่
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">เลขห้อง</span>
                      <span className="rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                        {data.room.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">ชั้น</span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.room.floor}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-200">
                  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900">
                    <User size={20} className="text-indigo-600" />
                    ผู้แจ้งซ่อม
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        ชื่อ-นามสกุล
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.tenant.firstName} {data.tenant.lastName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        เบอร์โทรศัพท์
                      </span>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <Phone size={14} className="text-gray-400" />{" "}
                        {data.tenant.phone || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <ImageIcon size={20} className="text-indigo-600" />{" "}
                  รูปภาพประกอบ{" "}
                  <span className="text-sm font-normal text-gray-400">
                    ({data.images.length})
                  </span>
                </div>
                {data.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {data.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImageUrl(img.url)}
                        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all active:scale-95"
                      >
                        <img
                          src={img.url}
                          alt={`maintenance-${idx}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <ZoomIn size={20} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <span className="text-sm">ไม่มีรูปภาพแนบ</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>
                    แจ้งเมื่อ:{" "}
                    <span className="font-medium text-gray-700">
                      {formatDate(data.createdAt)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>
                    อัปเดตล่าสุด:{" "}
                    <span className="font-medium text-gray-700">
                      {formatDate(data.updatedAt)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-5 sm:px-8">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 sm:w-auto"
              >
                ปิดหน้าต่าง
              </button>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {data.status === "OPEN" && (
                  <>
                    <button
                      onClick={() => triggerUpdateStatus("CANCELLED")}
                      disabled={isLoading}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-95 sm:w-auto"
                    >
                      <XCircle size={18} />
                      ยกเลิกรายการ
                    </button>
                    <button
                      onClick={() => triggerUpdateStatus("IN_PROGRESS")}
                      disabled={isLoading}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                      <CheckCircle size={18} />
                      รับเรื่อง / ดำเนินการ
                    </button>
                  </>
                )}
                {data.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => triggerUpdateStatus("COMPLETED")}
                    disabled={isLoading}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-95 sm:w-auto"
                  >
                    <CheckCircle size={18} />
                    ปิดงานซ่อม
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedImageUrl && (
        <div
          className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/90 duration-300"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button
            className="absolute top-6 right-6 z-[110] rounded-full bg-white/10 p-3 text-white transition-all hover:rotate-90 hover:bg-white/20 active:scale-90"
            onClick={() => setSelectedImageUrl(null)}
          >
            <X size={32} />
          </button>
          <div
            className="relative flex h-[90vh] w-[90vw] items-center justify-center overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageUrl}
              alt="Full view"
              className="animate-in zoom-in-95 max-h-full max-w-full object-contain duration-300"
            />
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() =>
          setConfirmConfig((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={handleConfirmUpdate}
        title={confirmConfig.title}
        description={confirmConfig.description}
        type={confirmConfig.type}
        isLoading={isLoading}
        confirmText="ยืนยันดำเนินการ"
      />
    </>
  );
}
