"use client";
import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import MaintenanceFilter, {
  MaintenanceFilterStatus,
} from "./MaintenanceFilter";
import MaintenanceTable from "./MaintenanceTable";
import log from "@/lib/logger";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory } from "@/features/dormitory";
import { maintenanceService } from "@/features/maintenance/services/maintenance.service";
import { MaintenanceRequest } from "@/features/maintenance";
import LoadingPage from "@/app/(owner)/owner/maintenance/loading";

export default function MaintenanceContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as MaintenanceFilterStatus;
  const urlDormId = searchParams.get("dormId");
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>(urlDormId || "ALL");
  const [status, setStatus] = useState<MaintenanceFilterStatus>(
    urlFilter || "ALL",
  );
  const [search, setSearch] = useState("");
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
    const currentDormId = searchParams.get("dormId") || "ALL";
    const currentFilter = searchParams.get("filter") || "ALL";

    if (currentDormId !== selectedDorm || currentFilter !== status) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("dormId", selectedDorm);
      params.set("filter", status);

      router.replace(`?${params.toString()}`, {
        scroll: false,
      });
    }
  }, [selectedDorm, status, router, searchParams]);

  useEffect(() => {
    const initDorms = async () => {
      try {
        const res = await DormService.getDorm();
        setDorms(res);
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
        status: status,
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

  if (isLoading) return <LoadingPage />;

  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            จัดการแจ้งซ่อม
          </h2>
          <p className="text-muted text-sm sm:text-base">
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
        <div className="border-border flex items-center justify-between border-t pt-4">
          <div className="text-muted hidden text-sm sm:block">
            แสดง {(page - 1) * LIMIT + (meta.total > 0 ? 1 : 0)}ถึง{" "}
            {Math.min(page * LIMIT, meta.total)}จากทั้งหมด {meta.total}รายการ
          </div>
          <div className="text-muted text-sm sm:hidden">
            หน้าที่ {page}จาก {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-border bg-surface text-foreground hover:bg-background flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              <span className="bg-background text-foreground rounded-lg px-3 py-2 text-sm font-medium">
                {page}
              </span>
              <span className="text-muted">/</span>
              <span className="text-muted px-2 text-sm">{meta.totalPages}</span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="border-border bg-surface text-foreground hover:bg-background flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
