"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  FileText,
  ChevronDown,
  Calendar,
  Home,
  Check,
} from "lucide-react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Dormitory } from "@/features/dormitory";
import { Spinner } from "../ui/Spinner";

// --- 1. Custom Select Component (Reusable) ---
// คอมโพเนนต์สำหรับทำ Dropdown สวยๆ ใช้ซ้ำได้
interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: any) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  icon,
  className = "",
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic: คลิกข้างนอกแล้วปิด Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* ปุ่มกดเปิด/ปิด */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : ""
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span
            className={`truncate ${!selectedLabel ? "text-gray-400" : "text-gray-700"}`}
          >
            {selectedLabel || placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* รายการ Dropdown */}
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-full min-w-[160px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 duration-200">
          {/* ส่วนนี้ทำให้ Scroll ได้ถ้าสูงเกิน (max-h-60) */}
          <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isActive && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-gray-400">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Stat Card Component ---
type StatCardProps = {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
};

const StatCard = ({
  title,
  value,
  subValue,
  icon,
  colorClass,
}: StatCardProps) => (
  <div className="flex items-start justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
      {subValue && (
        <p className="mt-1 text-xs font-medium text-gray-400">{subValue}</p>
      )}
    </div>
    <div className={`rounded-xl p-3 ${colorClass}`}>{icon}</div>
  </div>
);

// --- 3. Main Container ---
export default function OwnerContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string | null>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);

  const fetchDorms = useCallback(async () => {
    const data = await DormService.getDorm();
    setDorms(data);
    if (data.length > 0 && !selectedDormId) {
      setSelectedDormId(data[0].id);
    }
  }, [selectedDormId]);

  const fetchOverview = useCallback(async () => {
    if (!selectedDormId) return;
    try {
      setLoading(true);
      const data = await DormService.getOverview(selectedDormId, month, year);
      setOverview(data);
    } catch (error) {
      console.error(error);
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

  // เตรียมข้อมูลสำหรับ Select
  const monthOptions = [
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
  ].map((m, idx) => ({ value: idx + 1, label: m }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString(),
  }));

  const dormOptions = dorms.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <div className="min-h-screen p-6 pb-20">
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            ภาพรวมหอพัก <span className="text-blue-600">.</span>
          </h1>
          <p className="mt-2 text-gray-500">
            ดูสถิติ รายได้ และการแจ้งซ่อมประจำเดือน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Select: เลือกหอพัก */}
          <CustomSelect
            options={dormOptions}
            value={selectedDormId}
            onChange={setSelectedDormId}
            placeholder="เลือกหอพัก"
            icon={<Home size={16} className="text-blue-500" />}
            className="w-full sm:w-56"
          />

          {/* Custom Select: เลือกเดือน */}
          <CustomSelect
            options={monthOptions}
            value={month}
            onChange={setMonth}
            icon={<Calendar size={16} className="text-gray-400" />}
            className="w-full sm:w-40"
          />

          {/* Custom Select: เลือกปี */}
          <CustomSelect
            options={yearOptions}
            value={year}
            onChange={setYear}
            className="w-full sm:w-28"
          />
        </div>
      </div>

      {loading || !overview ? (
        <div className="flex h-80 w-full items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Spinner />
            <p className="animate-pulse text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
          {/* Section 1: การเงิน & ห้องพัก */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <DollarSign className="text-green-500" size={20} />
              สถานะการเงิน & ห้องพัก ({monthOptions[month - 1].label} {year})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="ชำระแล้ว (รายได้)"
                value={`฿${overview.bills.paid.amount.toLocaleString()}`}
                subValue={`${overview.bills.paid.count} บิล`}
                icon={<CheckCircle2 size={24} />}
                colorClass="bg-green-100 text-green-600"
              />
              <StatCard
                title="รอชำระ (ยังไม่จ่าย)"
                value={`฿${overview.bills.pending.amount.toLocaleString()}`}
                subValue={`${overview.bills.pending.count} บิล`}
                icon={<Clock size={24} />}
                colorClass="bg-yellow-100 text-yellow-600"
              />
              <StatCard
                title="เกินกำหนด (ค้างจ่าย)"
                value={`฿${overview.bills.overdue.amount.toLocaleString()}`}
                subValue={`${overview.bills.overdue.count} บิล`}
                icon={<AlertCircle size={24} />}
                colorClass="bg-red-100 text-red-600"
              />
              <StatCard
                title="ห้องพักที่มีผู้เช่า"
                value={`${overview.rooms.occupied} / ${overview.rooms.total}`}
                subValue={`ว่าง ${overview.rooms.available} ห้อง`}
                icon={<Users size={24} />}
                colorClass="bg-blue-100 text-blue-600"
              />
            </div>
          </div>

          {/* Section 2: การแจ้งซ่อม */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <Wrench className="text-orange-500" size={20} />
              การแจ้งซ่อม ({monthOptions[month - 1].label} {year})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: ทั้งหมด */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    แจ้งซ่อมทั้งหมด
                  </span>
                  <FileText size={20} className="text-gray-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">
                  {overview.maintenance.total}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-1.5 w-full rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Card 2: แจ้งแล้ว */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    แจ้งแล้ว (รอรับเรื่อง)
                  </span>
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-red-600">
                  {overview.maintenance.open}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-red-100">
                  <div
                    className="h-1.5 rounded-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${overview.maintenance.total ? (overview.maintenance.open / overview.maintenance.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Card 3: กำลังดำเนินการ */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    กำลังดำเนินการ
                  </span>
                  <Wrench size={20} className="text-orange-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-orange-600">
                  {overview.maintenance.inProgress}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-orange-100">
                  <div
                    className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
                    style={{
                      width: `${overview.maintenance.total ? (overview.maintenance.inProgress / overview.maintenance.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Card 4: ซ่อมเสร็จ */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    ซ่อมเสร็จแล้ว
                  </span>
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-green-600">
                  {overview.maintenance.completed}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-green-100">
                  <div
                    className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${overview.maintenance.total ? (overview.maintenance.completed / overview.maintenance.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="flex h-80 items-center justify-center rounded-3xl border border-gray-100 bg-white text-gray-400 shadow-sm lg:col-span-2">
              <div className="text-center">
                <p>กราฟรายได้รายเดือน ({year})</p>
                <p className="text-xs text-gray-300">
                  ข้อมูลหอพัก:{" "}
                  {dorms.find((d) => d.id === selectedDormId)?.name}
                </p>
              </div>
            </div>
            <div className="flex h-80 items-center justify-center rounded-3xl border border-gray-100 bg-white text-gray-400 shadow-sm">
              <p>สัดส่วนประเภทการแจ้งซ่อม</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
