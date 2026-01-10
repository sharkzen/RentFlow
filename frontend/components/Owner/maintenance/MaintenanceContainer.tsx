"use client";
import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MaintenanceFilter, {
  MaintenanceFilterStatus,
} from "./MaintenanceFilter";
import MaintenanceTable from "./MaintenanceTable";
import log from "@/lib/logger";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory } from "@/features/dormitory";
import { maintenanceService } from "@/features/maintenance/services/maintenance.service";
import { MaintenanceRequest } from "@/features/maintenance";

export default function MaintenanceContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaintenanceFilterStatus>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maintenances, setMaintenances] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const initDorms = async () => {
      try {
        const res = await DormService.getDorm();
        setDorms(res);

        if (res.length > 0) {
          setSelectedDorm(res[0].id);
        }
      } catch (error) {
        log.error("Failed to load dorms", error);
      }
    };

    initDorms();
  }, []);

  const fetchMaintenance = useCallback(async () => {
    if (!selectedDorm) return;

    setIsLoading(true);

    try {
      const res = await maintenanceService.getMaintenances({
        dormId: selectedDorm,
        search,
        status,
        startDate,
        endDate,
        page,
        limit: LIMIT,
      });

      setMaintenances(res.data);

      setMeta({
        total: res.meta.total,
        totalPages: res.meta.totalPages,
      });
    } catch (error) {
      log.error("Failed to load maintenance", error);
      setMaintenances([]);

      setMeta({
        total: 0,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDorm, search, status, startDate, endDate, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, selectedDorm, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaintenance();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchMaintenance]);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleActionComplete = (newStatus: MaintenanceFilterStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            จัดการแจ้งซ่อม
          </h2>
          <p className="text-sm text-gray-500 sm:text-base">
            จัดการรายการแจ้งซ่อมผู้เช่าในหอพัก
          </p>
        </div>
      </div>
      <MaintenanceFilter
        dorms={dorms}
        selectedDormId={selectedDorm}
        onDormChange={setSelectedDorm}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />
      <MaintenanceTable
        data={maintenances}
        loading={isLoading}
        onRefresh={fetchMaintenance}
        onChangeFilterStatus={handleActionComplete}
      />
      {!isLoading && meta.totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="hidden text-sm text-gray-500 sm:block">
            แสดง {(page - 1) * LIMIT + 1}ถึง{" "}
            {Math.min(page * LIMIT, meta.total)}จากทั้งหมด {meta.total}รายการ
          </div>
          <div className="text-sm text-gray-500 sm:hidden">
            หน้าที่ {page}จาก {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900">
                {page}
              </span>
              <span className="text-gray-400">/</span>
              <span className="px-2 text-sm text-gray-500">
                {meta.totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
