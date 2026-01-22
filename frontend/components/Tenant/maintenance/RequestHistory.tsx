import React, { useState } from "react";
import { MaintenanceRequest } from "@/features/tenant";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import {
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import LoadingPage from "@/components/layout/LoadingPage";
import MaintenanceDetailModal from "./MaintenanceDetailModal";
import { toast } from "react-toastify";

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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RequestHistoryProps {
  requests: MaintenanceRequest[];
  meta: PaginationMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRefreshNeeded: () => void;
}

export default function RequestHistory({
  requests = [],

  meta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  loading,
  onPageChange,
  onRefreshNeeded,
}: RequestHistoryProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);

  const handleError = (error: any) => {
    console.error(error);
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "เกิดข้อผิดพลาด กรุณาลองใหม่";
    toast.error(msg);
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    try {
      await TenantService.updateMaintenance(id, formData);
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
      onRefreshNeeded();
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await TenantService.cancelMaintenance(id);
      toast.success("ยกเลิกรายการแจ้งซ่อมแล้ว");
      onRefreshNeeded();
      setSelectedRequest(null);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <LoadingPage />
      </div>
    );
  }

  if (!loading && requests.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
          <Wrench className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          ยังไม่มีประวัติการแจ้งซ่อม
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((req) => {
          const StatusIcon = statusConfig[req.status].icon;

          return (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                  <Wrench className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="line-clamp-1 text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                        {req.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(
                            new Date(req.createdAt),
                            "d MMM yyyy • HH:mm",
                            {
                              locale: th,
                            },
                          )}{" "}
                          น.
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig[req.status].style}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig[req.status].label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, meta.page - 1))}
            disabled={meta.page === 1 || loading}
            className="cursor-pointer rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            หน้า {meta.page}จาก {meta.totalPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(meta.totalPages, meta.page + 1))
            }
            disabled={meta.page === meta.totalPages || loading}
            className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      <MaintenanceDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onSaveEdit={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}
