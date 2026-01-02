"use client";

import { Plus, Building, Search } from "lucide-react";
import { useEffect, useState } from "react";
import TenantList from "./TenantList";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { Dormitory } from "@/features/dormitory";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendErrorMsg";

export default function TenantContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>();

  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 0,
  });

  const LIMIT = 10;

  const getDorms = async () => {
    try {
      const res = await DormService.getDorm();
      setDorms(res);
      if (res.length > 0) {
        setSelectedDorm(res[0].id);
      }
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  const getTenants = async () => {
    if (!selectedDorm) return;

    try {
      const res = await TenantService.getTenantDorm({
        dormId: selectedDorm,
        page,
        limit: LIMIT,
        search: search || undefined,
      });

      setTenants(res.items);
      setMeta({
        total: res.total,
        totalPages: res.totalPages,
      });
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  useEffect(() => {
    getDorms();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedDorm]);

  useEffect(() => {
    getTenants();
  }, [selectedDorm, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      getTenants();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex h-[calc(90vh-2rem)] flex-col gap-6 overflow-hidden bg-white py-1">
      <div className="col-span-12 grid grid-cols-12 gap-3 md:col-span-8">
        <div className="relative order-1 col-span-12 sm:col-span-6 md:order-2 md:col-span-4">
          <select
            value={selectedDorm}
            onChange={(e) => setSelectedDorm(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-4 text-sm font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {dorms.map((dorm) => (
              <option key={dorm.id} value={dorm.id}>
                {dorm.name}
              </option>
            ))}
          </select>
          <Building className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="order-2 col-span-12 sm:col-span-6 md:order-3 md:col-span-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <Plus className="h-5 w-5" />
            เพิ่มผู้เช่า
          </button>
        </div>

        <div className="relative order-3 col-span-12 md:order-1 md:col-span-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาผู้เช่า / ห้อง / อีเมล"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="absolute inset-0 overflow-auto">
          <TenantList tenants={tenants} />
        </div>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm text-gray-600">
          <span>ทั้งหมด {meta.total} รายการ</span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border px-3 py-1 disabled:opacity-40"
            >
              ก่อนหน้า
            </button>

            <span>
              หน้า {page} / {meta.totalPages}
            </span>

            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border px-3 py-1 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
