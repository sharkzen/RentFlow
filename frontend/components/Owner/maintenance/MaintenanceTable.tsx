"use client";
import {
  Calendar,
  AlertCircle,
  FileImage,
  Eye,
  CheckCircle2,
  XCircle,
  Check,
  Loader2,
  FileSearch,
} from "lucide-react";

import { MaintenanceRequest, MaintenanceStatus } from "@/features/maintenance";
import { useState } from "react";
import MaintenanceDetailDialog from "./MaintenanceDetailDialog";
import ConfirmDialog, {
  ConfirmDialogType,
} from "@/components/ui/ConfirmDialog";
import { maintenanceService } from "@/features/maintenance/services/maintenance.service";
import { toast } from "react-toastify";
import { MaintenanceFilterStatus } from "./MaintenanceFilter";
import log from "@/lib/logger";
import MaintenanceStatusBadge from "./MaintenanceStatusBadge";

interface MaintenanceTableProps {
  data: MaintenanceRequest[];
  loading?: boolean;
  onRefresh?: () => void;
  onChangeFilterStatus?: (status: MaintenanceFilterStatus) => void;
}

type PendingAction = {
  id: string;
  status: MaintenanceStatus;
  type: "ACCEPT" | "CANCEL" | "COMPLETE";
} | null;

export default function MaintenanceTable({
  data,
  loading,
  onRefresh,
  onChangeFilterStatus,
}: MaintenanceTableProps) {
  const [selectedItem, setSelectedItem] = useState<MaintenanceRequest | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initiateAction = (
    e: React.MouseEvent | null,
    id: string,
    actionType: "ACCEPT" | "CANCEL" | "COMPLETE",
  ) => {
    e?.stopPropagation();
    let nextStatus: MaintenanceStatus;

    if (actionType === "ACCEPT") nextStatus = "IN_PROGRESS";
    else if (actionType === "CANCEL") nextStatus = "CANCELLED";
    else nextStatus = "COMPLETED";

    setPendingAction({
      id,
      status: nextStatus,
      type: actionType,
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);

    try {
      await toast.promise(
        maintenanceService.updateStatus(pendingAction.id, pendingAction.status),
        {
          pending: "กำลังบันทึกข้อมูล...",
          success: "อัปเดตสถานะเรียบร้อยแล้ว",

          error: {
            render({ data }: any) {
              const message = data?.response?.data?.message || data?.message;

              if (message === "FORBIDDEN_ACCESS")
                return "คุณไม่มีสิทธิ์ดำเนินการรายการนี้";

              if (message === "NOT_FOUND")
                return "ไม่พบรายการแจ้งซ่อมนี้ในระบบ";

              return "เกิดข้อผิดพลาดในการอัปเดตสถานะ";
            },
          },
        },
      );

      setPendingAction(null);
      setSelectedItem(null);

      if (onChangeFilterStatus) {
        if (pendingAction.status === "IN_PROGRESS") {
          onChangeFilterStatus("IN_PROGRESS");
        } else if (pendingAction.status === "COMPLETED") {
          onChangeFilterStatus("COMPLETED");
        } else if (pendingAction.status === "CANCELLED") {
          onChangeFilterStatus("CANCELLED");
        } else {
          onRefresh?.();
        }
      } else {
        onRefresh?.();
      }
    } catch (error) {
      log.error("Update status failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDialogConfig = () => {
    if (!pendingAction)
      return {
        title: "",
        desc: "",
        type: "info" as ConfirmDialogType,
      };

    switch (pendingAction.type) {
      case "ACCEPT":
        return {
          title: "ยืนยันรับเรื่องแจ้งซ่อม",
          desc: "คุณต้องการรับเรื่องรายการนี้และเปลี่ยนสถานะเป็น 'กำลังดำเนินการ' ใช่หรือไม่?",
          type: "info" as ConfirmDialogType,
          confirmText: "รับเรื่อง",
          cancelText: "ยกเลิก",
        };
      case "CANCEL":
        return {
          title: "ยืนยันยกเลิกรายการ",
          desc: "คุณต้องการยกเลิกรายการแจ้งซ่อมนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
          type: "error" as ConfirmDialogType,
          confirmText: "ยืนยันยกเลิก",
          cancelText: "กลับ",
        };
      case "COMPLETE":
        return {
          title: "ยืนยันปิดงานซ่อม",
          desc: "การซ่อมเสร็จสิ้นเรียบร้อยแล้วใช่หรือไม่? รายการนี้จะถูกบันทึกว่า 'ดำเนินการแล้ว'",
          type: "success" as ConfirmDialogType,
          confirmText: "ปิดงานซ่อม",
          cancelText: "ยังไม่เสร็จ",
        };
      default:
        return {
          title: "",
          desc: "",
          type: "info" as ConfirmDialogType,
        };
    }
  };

  const dialogConfig = getDialogConfig();
  const gridTemplate = "grid-cols-[140px_120px_2fr_1.5fr_1.2fr_120px]";

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-500">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-600" />
          กำลังโหลดรายการแจ้งซ่อม...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-400">
          <FileSearch className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <h3 className="text-base font-semibold text-gray-900">
            ไม่พบรายการแจ้งซ่อม
          </h3>
          <p className="mt-1 text-sm">
            ลองปรับตัวกรองหรือคำค้นหาดูใหม่อีกครั้ง
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[65vh] w-full flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white">
        <div className="custom-scrollbar h-full w-full overflow-auto">
          <div className="min-w-335">
            <div
              className={`sticky top-0 z-10 grid ${gridTemplate} gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase`}
            >
              <div>สถานะ</div>
              <div>ห้อง / พื้นที่</div>
              <div>หัวข้อการแจ้งซ่อม</div>
              <div>ผู้แจ้ง</div>
              <div>วันที่แจ้ง</div>
              <div className="text-right">จัดการ</div>
            </div>

            <div>
              {data.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`group grid ${gridTemplate} cursor-pointer items-center gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50`}
                >
                  <div>
                    <MaintenanceStatusBadge status={item.status} />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                        <span className="text-xs font-bold">
                          {item.room.roomNumber}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500">
                          ชั้น {item.room.floor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 pr-4">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {item.description}
                    </div>
                    {item.images.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                        <FileImage size={14} />
                        <span>{item.images.length}รูปภาพ</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {item.tenant.firstName} {item.tenant.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.tenant.phone || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("th-TH", {
                          year: "2-digit",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </div>

                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.status === "OPEN" && (
                      <>
                        <button
                          onClick={(e) => initiateAction(e, item.id, "ACCEPT")}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700 hover:shadow-sm"
                          title="รับเรื่อง"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={(e) => initiateAction(e, item.id, "CANCEL")}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 hover:shadow-sm"
                          title="ยกเลิก"
                        >
                          <XCircle size={16} />
                        </button>
                        <div className="mx-1 h-4 w-px bg-gray-200"></div>
                      </>
                    )}
                    {item.status === "IN_PROGRESS" && (
                      <>
                        <button
                          onClick={(e) =>
                            initiateAction(e, item.id, "COMPLETE")
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 hover:shadow-sm"
                          title="ปิดงานซ่อม"
                        >
                          <Check size={16} />
                        </button>
                        <div className="mx-1 h-4 w-px bg-gray-200"></div>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-indigo-600"
                      title="ดูรายละเอียด"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <MaintenanceDetailDialog
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          data={selectedItem}
          onUpdateStatus={(id, status) => {
            let actionType: "ACCEPT" | "CANCEL" | "COMPLETE" = "COMPLETE";

            if (status === "IN_PROGRESS") actionType = "ACCEPT";
            else if (status === "CANCELLED") actionType = "CANCEL";
            else if (status === "COMPLETED") actionType = "COMPLETE";

            initiateAction(null, id, actionType);
          }}
        />
      )}
      <ConfirmDialog
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        isLoading={isProcessing}
        title={dialogConfig.title}
        description={dialogConfig.desc}
        type={dialogConfig.type}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
      />
    </>
  );
}
