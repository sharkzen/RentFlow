"use client";
import {
  MapPin,
  Calendar,
  AlertCircle,
  FileImage,
  Eye,
  CheckCircle2,
  XCircle,
  Check,
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
import { Spinner } from "@/components/ui/Spinner";

const getStatusBadge = (status: MaintenanceStatus) => {
  switch (status) {
    case "OPEN":
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-600/20 ring-inset">
          รอรับเรื่อง
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
          รับเรื่องแล้ว
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
          ดำเนินการแล้ว
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
          ยกเลิก
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("th-TH", {
    year: "2-digit",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

  if (loading) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center rounded-3xl bg-white">
        <Spinner className="text-blue-500" />
        <p className="mt-3 animate-pulse text-sm text-gray-400">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="rounded-full bg-gray-50 p-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            ไม่พบรายการแจ้งซ่อม
          </h3>
          <p className="text-sm text-gray-500">
            ลองปรับตัวกรองหรือคำค้นหาดูใหม่อีกครั้ง
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-full min-h-125 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="custom-scrollbar h-full w-full overflow-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  ห้อง / พื้นที่
                </th>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  หัวข้อการแจ้งซ่อม
                </th>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  ผู้แจ้ง
                </th>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  วันที่แจ้ง
                </th>
                <th className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer transition-colors hover:bg-indigo-50/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                        <span className="text-xs font-bold">
                          {item.room.roomNumber}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          ชั้น {item.room.floor}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[200px] lg:max-w-xs">
                      <div
                        className="truncate text-sm font-medium text-gray-900"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      <div
                        className="truncate text-xs text-gray-500"
                        title={item.description}
                      >
                        {item.description}
                      </div>
                      {item.images.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                          <FileImage size={14} />
                          <span>{item.images.length}รูปภาพ</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {item.tenant.firstName} {item.tenant.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.tenant.phone || "-"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(item.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === "OPEN" && (
                        <>
                          <button
                            onClick={(e) =>
                              initiateAction(e, item.id, "ACCEPT")
                            }
                            className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700 hover:shadow-sm"
                            title="รับเรื่อง"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={(e) =>
                              initiateAction(e, item.id, "CANCEL")
                            }
                            className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 hover:shadow-sm"
                            title="ยกเลิก"
                          >
                            <XCircle size={18} />
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
                            className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 hover:shadow-sm"
                            title="ปิดงานซ่อม"
                          >
                            <Check size={18} />
                          </button>
                          <div className="mx-1 h-4 w-px bg-gray-200"></div>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
