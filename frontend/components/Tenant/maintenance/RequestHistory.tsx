import React from "react";
import { MaintenanceRequest } from "@/features/tenant";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface RequestHistoryProps {
  requests: MaintenanceRequest[];
  loading: boolean;
}

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

export default function RequestHistory({
  requests,
  loading,
}: RequestHistoryProps) {
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );

  if (requests.length === 0)
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
          <Wrench className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          ยังไม่มีประวัติการแจ้งซ่อม
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          คุณสามารถแจ้งปัญหาใหม่ได้ที่แท็บ "แจ้งเรื่องใหม่"
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const StatusIcon = statusConfig[req.status].icon;

        return (
          <div
            key={req.id}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-100 hover:shadow-md"
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
                        {format(new Date(req.createdAt), "d MMM yyyy • HH:mm", {
                          locale: th,
                        })}{" "}
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

                <div className="mt-3 rounded-lg border border-gray-100/50 bg-gray-50/80 p-3">
                  <p className="text-sm leading-relaxed text-gray-600">
                    {req.description || (
                      <span className="text-gray-400 italic">
                        ไม่มีรายละเอียดเพิ่มเติม
                      </span>
                    )}
                  </p>
                </div>

                {req.images && req.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {req.images.map((img) => (
                      <div
                        key={img.id}
                        className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={`/api/files/${img.objectKey}`}
                          alt="maintenance"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
