"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BillData, BillFilterState } from "./types";
import BillFilters from "./TenantBillFilters";
import BillList from "./BillList";
import { Wallet, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import LoadingPage from "@/lib/ui/layout/LoadingPage";

export default function BillContainer() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [filters, setFilters] = useState<BillFilterState>({
    year: "ALL",
    status: "ALL",
    month: "ALL",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "tenant-bills",
      {
        page,
        limit,
        ...filters,
      },
    ],

    queryFn: () =>
      TenantService.getMyBills({
        page,
        limit,
        year: filters.year,
        status: filters.status,
        month: filters.month,
      }),

    placeholderData: keepPreviousData,
  });

  const bills: BillData[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalPending = data?.summary.totalPending ?? 0;
  const loading = isLoading;
  const error = isError
    ? "ไม่สามารถดึงข้อมูลบิลได้ กรุณาลองใหม่อีกครั้ง"
    : null;

  const handleFilterChange = (key: keyof BillFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    setPage(1);
  };

  const handleBillClick = (id: string) => {
    router.push(`/tenant/bills/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading && page === 1 && bills.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex h-72 w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/50 p-6 text-center text-rose-600">
        <div className="rounded-full bg-rose-100 p-4">
          <AlertCircle size={36} className="text-rose-600" />
        </div>
        <p className="text-lg font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-surface mt-2 rounded-full px-8 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-50 hover:ring-rose-300 active:scale-95"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 md:space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
            ประวัติบิลค่าเช่า
          </h1>
          <p className="text-muted mt-2 text-sm md:text-base">
            ตรวจสอบรายการชำระเงินและประวัติย้อนหลังทั้งหมด
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <BillFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </div>
      <div className="border-border bg-surface relative overflow-hidden rounded-3xl border p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="text-muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase md:text-sm">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500"></span>
              ยอดที่ต้องชำระ (Pending Total)
            </div>
            <h2 className="text-foreground text-4xl font-bold tracking-tighter break-all md:text-5xl">
              <span className="text-muted mr-1 text-2xl md:text-3xl">฿</span>
              {totalPending.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </h2>
            <p className="text-muted text-xs md:text-sm">
              รวมบิลที่รอชำระและเกินกำหนดทั้งหมด
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 md:h-20 md:w-20">
            <Wallet size={32} strokeWidth={1.5} className="md:h-10 md:w-10" />
          </div>
        </div>
        <div className="from-background absolute top-0 right-0 z-0 h-full w-1/2 bg-linear-to-l to-transparent opacity-60"></div>
      </div>
      <div className="space-y-6">
        <div
          className={`transition-opacity duration-300 ${loading ? "pointer-events-none opacity-50" : "opacity-100"}`}
        >
          <BillList bills={bills} onSelectBill={handleBillClick} />
        </div>
        {totalPages > 1 && (
          <div className="border-border flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
            <p className="text-muted text-sm">
              หน้า <span className="text-foreground font-bold">{page}</span>จาก{" "}
              <span className="text-foreground font-bold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="border-border bg-surface text-muted hover:bg-background flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, i) => i + 1,
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none" : "text-muted hover:bg-background hover:text-foreground"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="border-border bg-surface text-muted hover:bg-background flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
