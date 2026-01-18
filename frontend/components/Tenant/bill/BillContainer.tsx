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
      <div className="flex h-75 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600">
        <div className="rounded-full bg-rose-100 p-3">
          <AlertCircle size={32} />
        </div>
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose-600 ring-1 ring-rose-200 transition-colors hover:bg-rose-50"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            ประวัติบิลค่าเช่า
          </h1>
          <p className="mt-2 text-slate-500">
            ตรวจสอบรายการชำระเงินและประวัติย้อนหลังทั้งหมด
          </p>
        </div>
        <BillFilters filters={filters} onChange={handleFilterChange} />
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-400 uppercase">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              ยอดที่ต้องชำระ (Pending Total)
            </div>
            <h2 className="text-5xl font-bold tracking-tighter text-slate-900">
              ฿
              {totalPending.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </h2>
            <p className="text-sm text-slate-400">
              รวมบิลที่รอชำระและเกินกำหนดทั้งหมด
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Wallet size={32} strokeWidth={1.5} />
          </div>
        </div>
        <div className="absolute top-0 right-0 z-0 h-full w-1/3 bg-linear-to-l from-slate-50 to-transparent opacity-50"></div>
      </div>
      <div className="space-y-6">
        {loading ? (
          <div className="pointer-events-none space-y-4 opacity-50">
            <BillList bills={bills} onSelectBill={() => {}} />
          </div>
        ) : (
          <BillList bills={bills} onSelectBill={handleBillClick} />
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              หน้า <span className="font-bold text-slate-800">{page}</span>จาก{" "}
              {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
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
                    className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
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
