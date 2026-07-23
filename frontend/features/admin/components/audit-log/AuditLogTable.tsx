"use client";
import React, { useState } from "react";
import { ChevronDown, User, Home } from "lucide-react";
import { ActivityLog } from "@/features/admin/types";
import { formatThaiDate } from "@/lib/dateFormatter";

interface AuditLogTableProps {
  data: ActivityLog[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const getActionBadge = (action: string) => {
  if (action.startsWith("CREATE") || action.startsWith("APPROVE"))
    return "bg-emerald-100 text-emerald-700";
  if (
    action.startsWith("DELETE") ||
    action.startsWith("REJECT") ||
    action.startsWith("CANCEL")
  )
    return "bg-red-100 text-red-700";
  if (action.startsWith("UPDATE") || action.startsWith("TOGGLE"))
    return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
};

export function AuditLogTable({
  data,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">เวลา</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">ผู้กระทำ</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">IP</th>
              <th className="px-6 py-4 text-right">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  ไม่พบประวัติกิจกรรมที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              data.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatThaiDate(log.createdAt, "short-datetime")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getActionBadge(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <User size={14} className="text-gray-400" />
                          <span className="line-clamp-1">
                            {log.user.email}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                            {log.user.role}
                          </span>
                        </div>
                      ) : log.tenant ? (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Home size={14} className="text-gray-400" />
                          {log.tenant.firstName} {log.tenant.lastName}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {log.entityType || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {log.ipAddress || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronDown
                        size={16}
                        className={`ml-auto text-gray-400 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-gray-500">
                              Entity ID:{" "}
                            </span>
                            <span className="text-gray-700">
                              {log.entityId || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500">
                              User ID:{" "}
                            </span>
                            <span className="text-gray-700">
                              {log.userId || log.tenantId || "-"}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-gray-500">
                              Metadata:
                            </span>
                            <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-3 text-[11px] text-gray-600 ring-1 ring-gray-200">
                              {log.metadata
                                ? JSON.stringify(log.metadata, null, 2)
                                : "-"}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-sm text-gray-600">
          แสดง {data.length > 0 ? (page - 1) * 20 + 1 : 0}ถึง{" "}
          {Math.min(page * 20, totalItems)}จาก {totalItems}รายการ
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
