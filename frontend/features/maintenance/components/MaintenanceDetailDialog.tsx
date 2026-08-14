"use client";
import {
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
  ZoomIn,
  MessageSquare,
} from "lucide-react";

import { MaintenanceRequest, MaintenanceStatus } from "@/features/maintenance";
import { useEffect, useState } from "react";
import { useScrollLock } from "usehooks-ts";
import ConfirmDialog, { ConfirmDialogType } from "@/lib/ui/ConfirmDialog";
import MaintenanceChatThread from "./MaintenanceChatThread";
import { maintenanceService } from "@/features/maintenance/services/maintenance.service";

interface MaintenanceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: MaintenanceRequest | null;
  onUpdateStatus: (
    id: string,
    newStatus: MaintenanceStatus,
    note?: string,
  ) => void;
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
  const [ownerNote, setOwnerNote] = useState("");

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    newStatus: MaintenanceStatus | null;
    title: string;
    description: string;
    type: ConfirmDialogType;
    inputPlaceholder: string;
  }>({
    isOpen: false,
    newStatus: null,
    title: "",
    description: "",
    type: "warning",
    inputPlaceholder: "",
  });

  const handleClose = () => {
    setOwnerNote("");
    onClose();
  };

  useEffect(() => {
    if (isOpen) lock();
    else unlock();

    return () => unlock();
  }, [isOpen, lock, unlock]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (selectedImageUrl) {
        setSelectedImageUrl(null);
      } else if (confirmConfig.isOpen) {
        setConfirmConfig((prev) => ({
          ...prev,
          isOpen: false,
        }));
      } else if (isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, selectedImageUrl, confirmConfig.isOpen]);

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
          title: "ระบุเหตุผลการยกเลิก",
          description:
            "กรุณาระบุเหตุผลเพื่อให้ผู้เช่าทราบถึงสาเหตุที่ยกเลิกรายการนี้",
          type: "error",
          inputPlaceholder: "ระบุเหตุผลการยกเลิก...",
        };

        break;
      case "IN_PROGRESS":
        config = {
          ...config,
          title: "รับเรื่องและเริ่มดำเนินการ",
          description:
            "คุณสามารถระบุนัดหมายหรือข้อความแจ้งผู้เช่าได้ที่นี่ (ไม่บังคับ)",
          type: "info",
          inputPlaceholder: "เช่น ช่างจะเข้าวันเสาร์นี้ตอน 10:00 น. ...",
        };

        break;
      case "COMPLETED":
        config = {
          ...config,
          title: "ยืนยันการปิดงานซ่อม",
          description: "แจ้งผลการดำเนินการหรือสรุปงานซ่อมให้ผู้เช่าทราบ",
          type: "success",
          inputPlaceholder:
            "เช่น ดำเนินการเปลี่ยนก๊อกน้ำใหม่ให้เรียบร้อยแล้ว...",
        };

        break;
    }

    setConfirmConfig(config);
  };

  const handleConfirmUpdate = () => {
    if (confirmConfig.newStatus && data) {
      onUpdateStatus(data.id, confirmConfig.newStatus, ownerNote);

      setConfirmConfig((prev) => ({
        ...prev,
        isOpen: false,
      }));

      setOwnerNote("");
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
          bg: "bg-background",
          text: "text-muted",
          border: "border-border",
          label: "ยกเลิก",
        };
      default:
        return {
          bg: "bg-background",
          text: "text-muted",
          border: "border-border",
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
          onClick={handleClose}
        />
        <div className="bg-surface animate-in fade-in zoom-in-95 relative flex max-h-screen w-full max-w-3xl flex-col overflow-hidden shadow-2xl ring-1 ring-gray-900/5 duration-200 sm:max-h-[90vh] sm:rounded-2xl">
          <div className="border-border bg-surface flex items-start justify-between border-b px-6 py-5 sm:px-8">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {statusStyle.label}
                </div>
                <span className="text-muted font-mono text-sm tracking-wide">
                  #{data.id.split("-")[0]}
                </span>
              </div>
              <h3 className="text-foreground mt-2 text-xl font-bold sm:text-2xl">
                {data.title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted hover:bg-background cursor-pointer rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="custom-scrollbar bg-surface flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-8">
              <div className="border-border bg-background/50 rounded-xl border p-5">
                <div className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText size={18} className="text-indigo-600" />
                  รายละเอียด
                </div>
                <p className="text-muted text-base leading-relaxed">
                  {data.description || "- ไม่มีรายละเอียดเพิ่มเติม -"}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border-border bg-surface flex flex-col rounded-xl border p-5 transition-colors hover:border-indigo-200">
                  <div className="border-border text-foreground mb-4 flex items-center gap-2 border-b pb-2 text-base font-semibold">
                    <Building size={20} className="text-indigo-600" />{" "}
                    ข้อมูลพื้นที่
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm">เลขห้อง</span>
                      <span className="rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                        {data.room.roomNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-border bg-surface flex flex-col rounded-xl border p-5 transition-colors hover:border-indigo-200">
                  <div className="border-border text-foreground mb-4 flex items-center gap-2 border-b pb-2 text-base font-semibold">
                    <User size={20} className="text-indigo-600" />
                    ผู้แจ้งซ่อม
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm">ชื่อ-นามสกุล</span>
                      <span className="text-foreground text-sm font-medium">
                        {data.tenant.firstName} {data.tenant.lastName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm">เบอร์ติดต่อ</span>
                      <span className="text-foreground text-sm font-medium">
                        {data.tenant.phone || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
                  <ImageIcon size={20} className="text-indigo-600" />{" "}
                  รูปภาพประกอบ
                </div>
                {data.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {data.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImageUrl(img.url)}
                        className="group border-border bg-background relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border transition-all active:scale-95"
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
                  <div className="border-border bg-background/50 text-muted flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed">
                    <ImageIcon size={32} className="mb-2 opacity-20" />{" "}
                    <span className="text-sm">ไม่มีรูปภาพแนบ</span>
                  </div>
                )}
              </div>
              <MaintenanceChatThread
                maintenanceId={data.id}
                currentRole="OWNER"
                enabled={
                  data.status === "IN_PROGRESS" || data.status === "COMPLETED"
                }
                readOnly={data.status === "COMPLETED"}
                getMessages={maintenanceService.getMessages}
                sendMessage={maintenanceService.sendMessage}
                editMessage={maintenanceService.editMessage}
              />
              <div className="border-border text-muted flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />{" "}
                  <span>
                    แจ้งเมื่อ:{" "}
                    <span className="text-foreground font-medium">
                      {formatDate(data.createdAt)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />{" "}
                  <span>
                    อัปเดตล่าสุด:{" "}
                    <span className="text-foreground font-medium">
                      {formatDate(data.updatedAt)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-border bg-background/50 border-t px-6 py-5 sm:px-8">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="border-border bg-surface text-foreground hover:bg-background inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-6 py-2.5 text-sm font-semibold transition-all active:scale-95 sm:w-auto"
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
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
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
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-700 active:scale-95 sm:w-auto"
                  >
                    <CheckCircle size={18} />
                    เสร็จสิ้น / ปิดงาน
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedImageUrl && (
        <div
          className="animate-in fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/90 duration-300"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button
            className="absolute top-6 right-6 z-100 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 active:scale-90"
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
        showInput={true}
        inputValue={ownerNote}
        onInputChange={setOwnerNote}
        inputPlaceholder={confirmConfig.inputPlaceholder}
      />
    </>
  );
}
