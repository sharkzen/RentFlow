"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Calendar } from "lucide-react";

interface MonthYearPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

const THAI_MONTHS = [
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
];

export default function MonthYearPicker({
  value,
  onChange,
}: MonthYearPickerProps) {
  const currentDate = value || new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const baseYear = new Date().getFullYear();

    return Array.from(
      {
        length: 16,
      },
      (_, i) => baseYear - 10 + i,
    );
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthRef.current &&
        !monthRef.current.contains(event.target as Node)
      ) {
        setIsMonthOpen(false);
      }

      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(1);
    newDate.setMonth(monthIndex);
    onChange(newDate);
    setIsMonthOpen(false);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(1);
    newDate.setFullYear(year);
    onChange(newDate);
    setIsYearOpen(false);
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="relative h-10 w-full sm:w-36" ref={monthRef}>
        <button
          type="button"
          onClick={() => setIsMonthOpen(!isMonthOpen)}
          className={`flex h-full w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-sm font-medium transition-all focus:outline-none ${isMonthOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar
              size={16}
              className={`shrink-0 ${isMonthOpen ? "text-indigo-500" : "text-gray-400"}`}
            />
            <span className="truncate">{THAI_MONTHS[currentMonth]}</span>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform duration-200 ${isMonthOpen ? "rotate-180 text-indigo-500" : ""}`}
          />
        </button>
        {isMonthOpen && (
          <div className="animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] left-0 z-50 max-h-60 w-full min-w-35 overflow-y-auto rounded-lg border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
            {THAI_MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => handleMonthChange(index)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${currentMonth === index ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{month}</span>
                {currentMonth === index && (
                  <Check size={14} className="text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-10 w-full sm:w-28" ref={yearRef}>
        <button
          type="button"
          onClick={() => setIsYearOpen(!isYearOpen)}
          className={`flex h-full w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-sm font-medium transition-all focus:outline-none ${isYearOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
        >
          <span>{currentYear + 543}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform duration-200 ${isYearOpen ? "rotate-180 text-indigo-500" : ""}`}
          />
        </button>
        {isYearOpen && (
          <div className="animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] left-0 z-50 max-h-60 w-full min-w-25 overflow-y-auto rounded-lg border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${currentYear === year ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{year + 543}</span>
                {currentYear === year && (
                  <Check size={14} className="text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
