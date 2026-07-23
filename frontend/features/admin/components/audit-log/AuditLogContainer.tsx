"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ScrollText, Search, RefreshCw, Calendar } from "lucide-react";
import { AdminService } from "@/features/admin/services/admin.service";
import { ActivityLog } from "@/features/admin/types";
import { AuditLogTable } from "./AuditLogTable";

export default function AuditLogContainer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await AdminService.getActivityLogs(
        page,
        20,
        debouncedSearch,
        entityTypeFilter,
        dateFrom || undefined,
        dateTo || undefined,
      );

      setLogs(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
      setEntityTypes(res.entityTypes);
    } catch (error) {
      toast.error("ไม่สามารถโหลดประวัติกิจกรรมได้");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, entityTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-md shadow-slate-200">
              <ScrollText size={20} />
            </div>
            ประวัติกิจกรรมระบบ (Audit Log)
          </h2>
          <p className="mt-1 pl-13 text-sm text-gray-500">
            บันทึกการกระทำสำคัญของผู้ใช้งานทั้งหมดในระบบ
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-icon flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />{" "}
          รีเฟรช
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute top-2.5 left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="ค้นหาจาก action เช่น CREATE_TENANT..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-blue-500"
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ทุกประเภท (Entity)</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Calendar
            className="absolute top-2.5 left-3 text-gray-400"
            size={16}
          />
          <input
            type="date"
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-blue-500"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="relative">
          <Calendar
            className="absolute top-2.5 left-3 text-gray-400"
            size={16}
          />
          <input
            type="date"
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-blue-500"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <AuditLogTable
        data={logs}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
      />
    </div>
  );
}
