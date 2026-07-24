import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Building2,
  Filter,
  Plus,
  ChevronDown,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Dormitory } from "@/features/dormitory";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}

function CustomSelect({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"} ${disabled ? "cursor-not-allowed bg-gray-50 opacity-50" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`h-4 w-4 ${isOpen ? "text-blue-500" : "text-gray-400"}`}
          />
          <span
            className={
              selectedOption && value !== "all"
                ? "font-medium text-gray-900"
                : "text-gray-500"
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute z-50 mt-2 max-h-60 w-full origin-top overflow-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${isSelected ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                {option.label}
                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QrCodeFiltersProps {
  dorms: Dormitory[];
  selectedDormId: string;
  setSelectedDormId: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCount: number;
  onBulkCreate: () => void;
  isBulkLoading: boolean;
}

export function QrCodeFilters({
  dorms,
  selectedDormId,
  setSelectedDormId,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  selectedCount,
  onBulkCreate,
  isBulkLoading,
}: QrCodeFiltersProps) {
  const dormOptions = [
    {
      label: "เลือกหอพัก",
      value: "all",
    },
    ...dorms.map((dorm) => ({
      label: dorm.name,
      value: dorm.id,
    })),
  ];

  const statusOptions = [
    {
      label: "สถานะ QR (ทั้งหมด)",
      value: "all",
    },
    {
      label: "เปิดใช้งานอยู่",
      value: "active",
    },
    {
      label: "ปิดใช้งาน / ยังไม่สร้าง",
      value: "inactive",
    },
  ];

  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-3 rounded-t-xl border-b border-gray-100 bg-gray-50/30 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:gap-4">
      <div className="min-w-0">
        <CustomSelect
          icon={Building2}
          value={selectedDormId}
          onChange={setSelectedDormId}
          options={dormOptions}
          placeholder="เลือกหอพัก"
        />
      </div>
      <div className="min-w-0">
        <CustomSelect
          icon={Filter}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="สถานะ QR"
        />
      </div>
      <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาห้อง..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-full w-full min-w-0 rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-900 transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-gray-100 p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={onBulkCreate}
        className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 sm:col-span-2 lg:col-span-1 lg:w-auto ${selectedCount > 0 && !isBulkLoading ? "cursor-pointer bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]" : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"}`}
      >
        {isBulkLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังสร้าง...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            สร้าง QR Code {selectedCount > 0 ? `(${selectedCount})` : ""}
          </>
        )}
      </button>
    </div>
  );
}
