"use client";
import React, { useState, useEffect, useRef } from "react";
import { Filter, Calendar, ChevronDown, Check } from "lucide-react";
import { BillFilterState } from "./types";

interface Props {
  filters: BillFilterState;
  onChange: (key: keyof BillFilterState, value: string) => void;
  availableYears?: string[];
}

const THAI_MONTHS = [
  {
    value: "ALL",
    label: "ทุกเดือน",
  },
  {
    value: "0",
    label: "มกราคม",
  },
  {
    value: "1",
    label: "กุมภาพันธ์",
  },
  {
    value: "2",
    label: "มีนาคม",
  },
  {
    value: "3",
    label: "เมษายน",
  },
  {
    value: "4",
    label: "พฤษภาคม",
  },
  {
    value: "5",
    label: "มิถุนายน",
  },
  {
    value: "6",
    label: "กรกฎาคม",
  },
  {
    value: "7",
    label: "สิงหาคม",
  },
  {
    value: "8",
    label: "กันยายน",
  },
  {
    value: "9",
    label: "ตุลาคม",
  },
  {
    value: "10",
    label: "พฤศจิกายน",
  },
  {
    value: "11",
    label: "ธันวาคม",
  },
];

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "ทุกสถานะ",
    color: "bg-slate-100",
  },
  {
    value: "PENDING",
    label: "รอชำระ",
    color: "bg-amber-100 text-amber-600",
  },
  {
    value: "WAITING_FOR_VERIFICATION",
    label: "รอตรวจสอบ",
    color: "bg-blue-100 text-blue-600",
  },
  {
    value: "PAID",
    label: "ชำระแล้ว",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    value: "OVERDUE",
    label: "เกินกำหนด",
    color: "bg-rose-100 text-rose-600",
  },
  {
    value: "CANCELLED",
    label: "ยกเลิก",
    color: "bg-slate-100 text-slate-500",
  },
];

export default function BillFilters({
  filters,
  onChange,
  availableYears,
}: Props) {
  const currentYear = new Date().getFullYear();

  const numericYearOptions =
    availableYears && availableYears.length > 0
      ? availableYears.map((y) => ({
          value: y,
          label: y,
        }))
      : [
          {
            value: currentYear.toString(),
            label: currentYear.toString(),
          },
          {
            value: (currentYear - 1).toString(),
            label: (currentYear - 1).toString(),
          },
          {
            value: (currentYear - 2).toString(),
            label: (currentYear - 2).toString(),
          },
        ];

  const yearOptions = [
    {
      value: "ALL",
      label: "ทุกปี",
    },
    ...numericYearOptions,
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <CustomDropdown
        label="เดือน"
        icon={<Calendar size={18} />}
        value={filters.month || "ALL"}
        options={THAI_MONTHS}
        onChange={(val) => onChange("month", val)}
        width="w-full sm:w-[160px]"
      />

      <CustomDropdown
        label="ปี"
        icon={<Calendar size={18} />}
        value={filters.year}
        options={yearOptions}
        onChange={(val) => onChange("year", val)}
        width="w-full sm:w-[120px]"
      />

      <CustomDropdown
        label="สถานะ"
        icon={<Filter size={18} />}
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(val) => onChange("status", val)}
        width="w-full sm:w-[200px]"
        renderOption={(option) => (
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${option.color?.split(" ")[0].replace("bg-", "bg-") || "bg-slate-300"}`}
            />
            <span>{option.label}</span>
          </div>
        )}
      />
    </div>
  );
}

interface DropdownProps {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
    color?: string;
  }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  width?: string;
  renderOption?: (option: any) => React.ReactNode;
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  icon,
  width = "w-full",
  renderOption,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${width}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-medium transition-all ${isOpen ? "border-indigo-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-3 truncate text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="truncate">
            {renderOption ? renderOption(selectedOption) : selectedOption.label}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-2 max-h-[300px] w-full min-w-[180px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50 duration-100">
          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? "bg-indigo-50 font-semibold text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-2">
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
