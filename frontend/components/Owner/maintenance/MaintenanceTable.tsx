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
        if (
          ["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(
            pendingAction.status,
          )
        ) {
          onChangeFilterStatus(pendingAction.status as MaintenanceFilterStatus);
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
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
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
                  <div className="font-bold text-slate-700">
                    {item.room.roomNumber}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                  <div className="text-sm">
                    {item.tenant.firstName} {item.tenant.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("th-TH")}
                  </div>
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.status === "OPEN" && (
                      <>
                        <button
                          onClick={(e) => initiateAction(e, item.id, "ACCEPT")}
                          className="rounded-full p-2 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={(e) => initiateAction(e, item.id, "CANCEL")}
                          className="rounded-full p-2 text-red-600 hover:bg-red-50"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-2 text-gray-400 hover:text-indigo-600"
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
