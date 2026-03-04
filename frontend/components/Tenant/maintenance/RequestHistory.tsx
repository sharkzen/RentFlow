"use client";
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
  Clock,
} from "lucide-react";

import LoadingPage from "@/components/layout/LoadingPage";
import MaintenanceDetailModal from "./MaintenanceDetailModal";
import { toast } from "react-toastify";

export const statusConfig = {
  OPEN: {
    label: "รอรับเรื่อง",
    style: "bg-amber-50 text-amber-600 ring-amber-200",
    icon: Clock,
  },

  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    style: "bg-blue-50 text-blue-600 ring-blue-200",
    icon: Wrench,
  },

  COMPLETED: {
    label: "เสร็จสิ้น",
    style: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    icon: CheckCircle2,
  },

  CANCELLED: {
    label: "ยกเลิก",
    style: "bg-slate-50 text-slate-500 ring-slate-200",
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
    const deletePromise = TenantService.cancelMaintenance(id).then((res) => {
      onRefreshNeeded();
      setSelectedRequest(null);
      return res;
    });

    toast.promise(deletePromise, {
      pending: "กำลังดำเนินการยกเลิกรายการแจ้งซ่อม...",
      success: "ยกเลิกรายการแจ้งซ่อมเรียบร้อยแล้ว",

      error: {
        render({ data }: { data: any }) {
          const errorMsg = data?.response?.data?.message;

          if (errorMsg === "Maintenance request not found or not authorized") {
            return "ไม่พบรายการแจ้งซ่อม หรือคุณไม่มีสิทธิ์ลบรายการนี้";
          }

          if (errorMsg === "Cannot cancel request that is not OPEN") {
            return "ไม่สามารถยกเลิกได้ เนื่องจากเจ้าหน้าที่รับเรื่องไปแล้ว";
          }

          return errorMsg || "เกิดข้อผิดพลาดในการลบรายการ กรุณาลองใหม่อีกครั้ง";
        },
      },
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (!loading && requests.length === 0) {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center md:p-12">
        <div className="mb-4 rounded-full bg-white p-5 text-slate-400 ring-1 ring-slate-100">
          <Wrench size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-700">
          ยังไม่มีประวัติการแจ้งซ่อม
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          เมื่อคุณแจ้งปัญหาการใช้งานหรือแจ้งซ่อม รายการทั้งหมดจะมาแสดงอยู่ที่นี่
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {requests.map((req) => {
          const StatusIcon = statusConfig[req.status].icon;

          return (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="group flex w-full cursor-pointer items-center gap-3 p-4 transition-all duration-200 hover:bg-slate-50 active:bg-slate-100 sm:p-5"
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <h4 className="line-clamp-1 text-base font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                  {req.title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={12} className="shrink-0" />
                  <span className="truncate">
                    {format(new Date(req.createdAt), "d MMM yyyy • HH:mm", {
                      locale: th,
                    })}{" "}
                    น.
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusConfig[req.status].style}`}
                >
                  <StatusIcon size={12} strokeWidth={2.5} />
                  {statusConfig[req.status].label}
                </span>
              </div>
              <div className="ml-1 flex shrink-0 items-center justify-center sm:ml-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-active:scale-95">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => onPageChange(Math.max(1, meta.page - 1))}
            disabled={meta.page === 1 || loading}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-slate-600">
            หน้า {meta.page}จาก {meta.totalPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(meta.totalPages, meta.page + 1))
            }
            disabled={meta.page === meta.totalPages || loading}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      {selectedRequest && (
        <MaintenanceDetailModal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
          onSaveEdit={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
