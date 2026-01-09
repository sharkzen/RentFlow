"use client";
import {
  Building,
  ChevronDown,
  Check,
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
export type MaintenanceFilterStatus =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface Dormitory {
  id: string;
  name: string;
}

interface MaintenanceToolbarProps {
  dorms: Dormitory[];
  selectedDormId: string | undefined;
  onDormChange: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: MaintenanceFilterStatus;
  onStatusChange: (value: MaintenanceFilterStatus) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

export default function MaintenanceFilter({
  dorms,
  selectedDormId,
  onDormChange,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  startDate,
  onDateChange,
  endDate,
}: MaintenanceToolbarProps) {
  const [isDormOpen, setIsDormOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const currentDormName =
    dorms.find((d) => d.id === selectedDormId)?.name || "เลือกหอพัก";

  const statusOptions: {
    label: string;
    value: MaintenanceFilterStatus;
    desc?: string;
    colorClass?: string;
  }[] = [
    {
      label: "ทั้งหมด",
      value: "ALL",
      desc: "รวมทุกสถานะ",
    },
    {
      label: "รอรับเรื่อง",
      value: "OPEN",
      desc: "แจ้งซ่อมใหม่",
      colorClass: "text-yellow-600",
    },
    {
      label: "รับเรื่องแล้ว",
      value: "IN_PROGRESS",
      desc: "กําลังดำเนินการ",
      colorClass: "text-blue-600",
    },
    {
      label: "ดำเนินการแล้ว",
      value: "COMPLETED",
      desc: "ซ่อมเสร็จ/ปิดงานแล้ว",
      colorClass: "text-green-600",
    },
    {
      label: "ยกเลิก",
      value: "CANCELLED",
      desc: "รายการที่ถูกยกเลิก",
      colorClass: "text-gray-400",
    },
  ];

  const currentStatusLabel = statusOptions.find(
    (opt) => opt.value === statusValue,
  )?.label;

  const useOutsideClick = (callback: () => void) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) callback();
      };

      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [callback]);

    return ref;
  };

  const dormRef = useOutsideClick(() => setIsDormOpen(false));
  const statusRef = useOutsideClick(() => setIsStatusOpen(false));
  const dateRef = useOutsideClick(() => setIsDateOpen(false));

  const getDateLabel = () => {
    if (startDate && endDate)
      return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;

    if (startDate) return `ตั้งแต่ ${formatDateShort(startDate)}`;

    if (endDate) return `ถึง ${formatDateShort(endDate)}`;

    return "ช่วงเวลา";
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="mb-4 grid grid-cols-12 gap-3">
      <div className="col-span-12 sm:col-span-4 md:col-span-3" ref={dormRef}>
        <div className="relative h-full">
          <button
            onClick={() => setIsDormOpen(!isDormOpen)}
            className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm font-medium transition-all focus:outline-none ${isDormOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Building
                size={18}
                className={isDormOpen ? "text-indigo-500" : "text-gray-400"}
              />
              <span className="truncate">{currentDormName}</span>
            </div>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform ${isDormOpen ? "rotate-180 text-indigo-500" : "text-gray-400"}`}
            />
          </button>
          {isDormOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] left-0 z-20 w-full min-w-50 rounded-lg border border-gray-100 bg-white p-1 shadow-lg">
              <div className="custom-scrollbar max-h-60 overflow-y-auto">
                {dorms.map((dorm) => (
                  <button
                    key={dorm.id}
                    onClick={() => {
                      onDormChange(dorm.id);
                      setIsDormOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${selectedDormId === dorm.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <span className="truncate">{dorm.name}</span>
                    {selectedDormId === dorm.id && (
                      <Check size={14} className="text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 sm:col-span-8 md:col-span-4 lg:col-span-5">
        <div className="relative h-full">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหา..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pr-8 pl-9 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div
        className="col-span-6 sm:col-span-6 md:col-span-3 lg:col-span-2"
        ref={dateRef}
      >
        <div className="relative h-full">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm font-medium transition-all focus:outline-none ${isDateOpen || startDate || endDate ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CalendarIcon
                size={16}
                className={
                  isDateOpen || startDate || endDate
                    ? "text-indigo-500"
                    : "text-gray-400"
                }
              />
              <span className="truncate text-xs sm:text-sm">
                {getDateLabel()}
              </span>
            </div>
          </button>
          {isDateOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] right-0 z-20 w-[260px] rounded-lg border border-gray-100 bg-white p-4 md:left-0">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onDateChange(e.target.value, endDate)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => onDateChange(startDate, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      onDateChange("", "");
                      setIsDateOpen(false);
                    }}
                    className="mt-1 text-center text-xs text-red-500 hover:underline"
                  >
                    ล้างค่าวันที่
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="col-span-6 sm:col-span-6 md:col-span-2 lg:col-span-2"
        ref={statusRef}
      >
        <div className="relative h-full">
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm font-medium transition-all focus:outline-none ${isStatusOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Filter
                size={16}
                className={isStatusOpen ? "text-indigo-500" : "text-gray-400"}
              />
              <span className="truncate">{currentStatusLabel}</span>
            </div>
          </button>

          {isStatusOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] right-0 z-20 w-full min-w-[160px] rounded-lg border border-gray-100 bg-white p-1 shadow-lg">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onStatusChange(option.value);
                    setIsStatusOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${statusValue === option.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={option.colorClass}>{option.label}</span>
                  </div>
                  {statusValue === option.value && (
                    <Check size={14} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
