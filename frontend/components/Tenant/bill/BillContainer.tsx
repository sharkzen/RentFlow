"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BillData, BillFilterState } from "./types";
import BillFilters from "./BillFilters";
import BillList from "./BillList";
import { Wallet, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import LoadingPage from "@/components/layout/LoadingPage";
import log from "@/lib/logger";

export default function BillContainer() {
  const router = useRouter();
  const [bills, setBills] = useState<BillData[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BillFilterState>({
    year: "ALL",
    status: "ALL",
    month: "ALL",
  });

  const fetchBills = async () => {
    try {
      setLoading(true);

      const data = await TenantService.getMyBills({
        page,
        limit,
        year: filters.year,
        status: filters.status,
        month: filters.month,
      });

      setBills(data.items);
      setTotalPages(data.totalPages);
      setTotalPending(data.summary.totalPending);
      setError(null);
    } catch (err: any) {
      log.error("Failed to fetch bills:", err);
      setError("ไม่สามารถดึงข้อมูลบิลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, filters]);

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
          className="mt-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200 transition-all hover:bg-rose-50 hover:ring-rose-300 active:scale-95"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            ประวัติบิลค่าเช่า
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            ตรวจสอบรายการชำระเงินและประวัติย้อนหลังทั้งหมด
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <BillFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase md:text-sm">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500"></span>
              ยอดที่ต้องชำระ (Pending Total)
            </div>
            <h2 className="text-4xl font-bold tracking-tighter break-all text-slate-900 md:text-5xl">
              <span className="mr-1 text-2xl text-slate-400 md:text-3xl">
                ฿
              </span>
              {totalPending.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </h2>
            <p className="text-xs text-slate-400 md:text-sm">
              รวมบิลที่รอชำระและเกินกำหนดทั้งหมด
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 md:h-20 md:w-20">
            <Wallet size={32} strokeWidth={1.5} className="md:h-10 md:w-10" />
          </div>
        </div>
        <div className="absolute top-0 right-0 z-0 h-full w-1/2 bg-linear-to-l from-slate-50 to-transparent opacity-60"></div>
      </div>
      <div className="space-y-6">
        <div
          className={`transition-opacity duration-300 ${loading ? "pointer-events-none opacity-50" : "opacity-100"}`}
        >
          <BillList bills={bills} onSelectBill={handleBillClick} />
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
            <p className="text-sm text-slate-500">
              หน้า <span className="font-bold text-slate-800">{page}</span>จาก{" "}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
