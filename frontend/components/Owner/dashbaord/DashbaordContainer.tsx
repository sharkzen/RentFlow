"use client";
import { useCallback, useEffect, useState } from "react";
import { Home, Calendar } from "lucide-react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory } from "@/features/dormitory";
import { Spinner } from "@/lib/ui/Spinner";
import { CustomSelect } from "@/lib/ui/CustomSelect";
import { FinancialSection } from "./FinancialSection";
import { MaintenanceSection } from "./MaintenanceSection";
import { RevenueChart } from "./RevenueChart";
import { MaintenancePieChart } from "./MaintenancePieChart";
import log from "@/lib/logger";

export default function DashboardContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string>("ALL");
  const [month, setMonth] = useState<number | "ALL">("ALL");
  const [year, setYear] = useState<number | "ALL">("ALL");
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDorms = useCallback(async () => {
    try {
      const data = await DormService.getDorm();
      setDorms(data);
    } catch (error) {
      log.error("Failed to fetch dorms", error);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const queryMonth = month === "ALL" ? "ALL" : month.toString();
      const queryYear = year === "ALL" ? "ALL" : year.toString();
      const data = await DormService.getDashboard(
        selectedDormId,
        queryMonth,
        queryYear,
      );
      setOverview(data);
    } catch (error) {
      log.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDormId, month, year]);

  useEffect(() => {
    fetchDorms();
  }, [fetchDorms]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const monthOptions = [
    {
      value: "ALL",
      label: "ทุกเดือน",
    },
    ...[
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ].map((m, idx) => ({
      value: idx + 1,
      label: m,
    })),
  ];

  const currentYearInt = new Date().getFullYear();

  const yearOptions = [
    {
      value: "ALL",
      label: "ทุกปี",
    },
    ...Array.from(
      {
        length: 5,
      },
      (_, i) => ({
        value: currentYearInt - i,
        label: (currentYearInt - i).toString(),
      }),
    ),
  ];

  const dormOptions = [
    {
      value: "ALL",
      label: "ทั้งหมด (ทุกหอพัก)",
    },
    ...dorms.map((d) => ({
      value: d.id,
      label: d.name,
    })),
  ];

  const currentDormLabel =
    selectedDormId === "ALL"
      ? "ทุกหอพัก"
      : dorms.find((d) => d.id === selectedDormId)?.name || "-";
  const currentMonthLabel =
    month === "ALL"
      ? "ทุกเดือน"
      : monthOptions.find((m) => m.value === month)?.label || "-";
  const currentYearLabel = year === "ALL" ? "ตลอดชีพ" : year;

  return (
    <div className="min-h-screen">
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">ภาพรวมหอพัก</h1>
          <p className="mt-2 text-gray-500">
            ดูสถิติ รายได้ และการแจ้งซ่อมแบบครบวงจร
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            options={dormOptions}
            value={selectedDormId}
            onChange={setSelectedDormId}
            placeholder="เลือกหอพัก"
            icon={<Home size={16} className="text-blue-500" />}
            className="w-full sm:w-64"
          />
          <CustomSelect
            options={monthOptions}
            value={month}
            onChange={setMonth}
            icon={<Calendar size={16} className="text-gray-400" />}
            className="w-full sm:w-40"
          />
          <CustomSelect
            options={yearOptions}
            value={year}
            onChange={setYear}
            className="w-full sm:w-28"
          />
        </div>
      </div>
      {loading || !overview ? (
        <div className="flex h-96 w-full flex-col items-center justify-center rounded-3xl bg-white">
          <Spinner className="text-blue-500" />
          <p className="mt-3 animate-pulse text-sm text-gray-400">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
          <FinancialSection
            overview={overview}
            monthLabel={currentMonthLabel}
            year={currentYearLabel}
          />
          <MaintenanceSection
            overview={overview}
            monthLabel={currentMonthLabel}
            year={currentYearLabel}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-6 lg:col-span-2">
              <RevenueChart data={overview.monthlyRevenue || []} />
              <p className="mt-4 text-xs text-gray-300">
                ข้อมูล: {currentDormLabel}({currentMonthLabel}{" "}
                {currentYearLabel})
              </p>
            </div>
            <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-6">
              <MaintenancePieChart
                open={overview.maintenance.open}
                inProgress={overview.maintenance.inProgress}
                completed={overview.maintenance.completed}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
