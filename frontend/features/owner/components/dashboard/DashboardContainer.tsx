"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Home, Calendar, FileDown } from "lucide-react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory } from "@/features/dormitory";
import { CustomSelect } from "@/lib/ui/CustomSelect";
import dynamic from "next/dynamic";
import { FinancialSection } from "./FinancialSection";
import { MaintenanceSection } from "./MaintenanceSection";
import LoadingPage from "@/app/(owner)/owner/dashboard/loading";

const RevenueChart = dynamic(
  () => import("./RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
  },
);

const MaintenancePieChart = dynamic(
  () => import("./MaintenancePieChart").then((mod) => mod.MaintenancePieChart),
  {
    ssr: false,
  },
);

import log from "@/lib/logger";
import { toast } from "react-toastify";

export default function DashboardContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string>("ALL");
  const [month, setMonth] = useState<number | "ALL">("ALL");
  const [year, setYear] = useState<number | "ALL">("ALL");
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const isMountedRef = useRef(true);

  const fetchDorms = useCallback(async () => {
    try {
      const data = await DormService.getDorm();

      if (isMountedRef.current) setDorms(data);
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

      if (isMountedRef.current) setOverview(data);
    } catch (error) {
      log.error("Failed to fetch dashboard data", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [selectedDormId, month, year]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDorms();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDorms]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOverview();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchOverview]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const queryMonth = month === "ALL" ? "ALL" : month.toString();
      const queryYear = year === "ALL" ? "ALL" : year.toString();
      const blob = await DormService.exportDashboard(
        selectedDormId,
        queryMonth,
        queryYear,
      );
      const pdfUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `income-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      log.error("Failed to export dashboard report", error);
      toast.error("ไม่สามารถสร้างรายงาน PDF ได้");
    } finally {
      setIsExporting(false);
    }
  };

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

  if (loading || !overview) return <LoadingPage />;

  return (
    <div className="min-h-screen">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-extrabold">
            ภาพรวมหอพัก
          </h1>
          <p className="text-muted mt-2">
            ดูสถิติ รายได้ และการแจ้งซ่อมแบบครบวงจร
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
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
            icon={<Calendar size={16} className="text-muted" />}
            className="w-full sm:w-40"
          />
          <CustomSelect
            options={yearOptions}
            value={year}
            onChange={setYear}
            className="w-full sm:w-28"
          />
          <button
            onClick={handleExport}
            disabled={isExporting || loading || !overview}
            className="border-border bg-surface text-muted hover:bg-background flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown
              size={16}
              className={isExporting ? "animate-pulse" : ""}
            />
            {isExporting ? "กำลังสร้างไฟล์..." : "Export PDF"}
          </button>
        </div>
      </div>
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
          <div className="border-border bg-surface flex h-96 flex-col items-center justify-center rounded-3xl border p-6 lg:col-span-2">
            <RevenueChart data={overview?.monthlyRevenue || []} />
            <p className="text-muted mt-4 text-xs">
              ข้อมูล: {currentDormLabel}({currentMonthLabel} {currentYearLabel})
            </p>
          </div>
          <div className="border-border bg-surface flex h-96 flex-col items-center justify-center rounded-3xl border p-6">
            <MaintenancePieChart
              open={overview?.maintenance?.open || 0}
              inProgress={overview?.maintenance?.inProgress || 0}
              completed={overview?.maintenance?.completed || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
