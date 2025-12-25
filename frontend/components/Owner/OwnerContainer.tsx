"use client";

import { useCallback, useEffect, useState } from "react";
import StatCard from "./StatCard";
import { Users, DollarSign, Home, AlertCircle } from "lucide-react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory, DormOverview } from "@/features/dormitory";
import { ChevronDown, Check } from "lucide-react";
export default function OwnerContainer() {
  const [open, setOpen] = useState(false);

  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);
  const [overview, setOverview] = useState<DormOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const fetchDorms = useCallback(async () => {
    const data = await DormService.getDorm();
    setDorms(data);

    if (data.length > 0) {
      setSelectedDormId(data[0].id);
    }
  }, []);

  const fetchOverview = useCallback(async (dormId: string) => {
    try {
      setLoadingOverview(true);
      const data = await DormService.getOverview(dormId);
      setOverview(data);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchDorms();
  }, [fetchDorms]);

  useEffect(() => {
    if (selectedDormId) {
      fetchOverview(selectedDormId);
    }
  }, [selectedDormId, fetchOverview]);

  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 p-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent">
              ภาพรวม
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              เลือกหอพักเพื่อดูข้อมูลภาพรวม
            </p>
          </div>

          {dorms.length > 1 && (
            <div className="relative w-full md:w-80">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-400">หอพัก</span>
                  <span className="truncate">
                    {dorms.find((d) => d.id === selectedDormId)?.name ??
                      "เลือกหอพัก"}
                  </span>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {dorms.map((dorm) => {
                    const active = dorm.id === selectedDormId;

                    return (
                      <button
                        key={dorm.id}
                        onClick={() => {
                          setSelectedDormId(dorm.id);
                          setOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        } `}
                      >
                        <span className="truncate">{dorm.name}</span>
                        {active && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loadingOverview || !overview ? (
            <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
          ) : (
            <>
              <StatCard
                title="รายได้เดือนนี้"
                value={`฿${overview.income.thisMonth.toLocaleString()}`}
                icon={<DollarSign size={20} />}
                color="green"
              />

              <StatCard
                title="ห้องที่มีผู้เช่า"
                value={`${overview.rooms.occupied}/${overview.rooms.total}`}
                icon={<Home size={20} />}
                color="blue"
              />

              <StatCard
                title="บิลค้างชำระ"
                value={overview.bills.overdue}
                icon={<AlertCircle size={20} />}
                color="red"
              />

              <StatCard
                title="แจ้งซ่อม"
                value={overview.maintenance.open}
                icon={<Users size={20} />}
                color="orange"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm lg:col-span-2">
            {selectedDormId
              ? `[Chart สำหรับหอ ${selectedDormId}]`
              : "ไม่มีข้อมูล"}
          </div>

          <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm">
            (เวอร์ชันถัดไป: รายการแจ้งซ่อม)
          </div>
        </div>
      </main>
    </div>
  );
}
