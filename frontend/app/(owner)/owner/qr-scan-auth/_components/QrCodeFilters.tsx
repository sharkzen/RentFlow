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
    <div className="relative h-full w-full min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-surface flex w-full min-w-0 items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none ${isOpen ? "border-blue-500" : "border-border hover:border-muted"} ${disabled ? "bg-background cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon
            className={`h-4 w-4 shrink-0 ${isOpen ? "text-blue-500" : "text-muted"}`}
          />
          <span
            className={`truncate text-left ${selectedOption && value !== "all" ? "text-foreground font-medium" : "text-muted"}`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute z-50 mt-2 max-h-60 w-full origin-top space-y-1 overflow-auto rounded-xl border p-1.5 shadow-xl ring-1 ring-black/5">
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${isSelected ? "bg-blue-50 font-semibold text-blue-700 dark:bg-gray-800" : "text-foreground hover:bg-background hover:text-foreground"}`}
              >
                <span className="truncate pr-2 text-left">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-blue-600" />
                )}
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
    <div className="border-border bg-background/30 grid w-full min-w-0 grid-cols-1 items-center gap-3 rounded-t-xl border-b p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:gap-4">
      <div className="flex w-full min-w-0 items-stretch [&_[role=combobox]]:h-11 [&_button]:h-11 [&>div]:h-11 [&>div]:w-full">
        <CustomSelect
          icon={Building2}
          value={selectedDormId}
          onChange={setSelectedDormId}
          options={dormOptions}
          placeholder="เลือกหอพัก"
        />
      </div>

      <div className="flex w-full min-w-0 items-stretch [&_[role=combobox]]:h-11 [&_button]:h-11 [&>div]:h-11 [&>div]:w-full">
        <CustomSelect
          icon={Filter}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="สถานะ QR"
        />
      </div>

      <div className="relative h-11 w-full min-w-0 sm:col-span-2 lg:col-span-1">
        <Search className="text-muted absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ค้นหาห้อง..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-border bg-surface text-foreground placeholder:text-muted hover:border-muted h-full w-full min-w-0 rounded-xl border pr-10 pl-10 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="bg-background text-muted hover:bg-border hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <button
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={onBulkCreate}
        className={`flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold whitespace-nowrap transition-all duration-200 sm:col-span-2 lg:col-span-1 lg:w-auto ${selectedCount > 0 && !isBulkLoading ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]" : "bg-background text-muted cursor-not-allowed opacity-60"}`}
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
