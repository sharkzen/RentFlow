"use client";
import { useState, useRef, useEffect } from "react";
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

  const years = Array.from(
    {
      length: 11,
    },
    (_, i) => currentYear - 5 + i,
  );

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
    newDate.setMonth(monthIndex);
    onChange(newDate);
    setIsMonthOpen(false);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    onChange(newDate);
    setIsYearOpen(false);
  };

  return (
    <div className="flex h-full items-center gap-2">
      <div className="relative h-full" ref={monthRef}>
        <button
          type="button"
          onClick={() => setIsMonthOpen(!isMonthOpen)}
          className={`flex h-full min-w-36 items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:outline-none ${isMonthOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
        >
          <div className="flex items-center gap-2">
            <Calendar
              size={16}
              className={isMonthOpen ? "text-indigo-500" : "text-gray-400"}
            />
            <span>{THAI_MONTHS[currentMonth]}</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isMonthOpen ? "rotate-180 text-indigo-500" : ""}`}
          />
        </button>
        {isMonthOpen && (
          <div className="custom-scrollbar animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] left-0 z-20 max-h-75 w-full min-w-40 overflow-y-auto rounded-lg border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5 duration-100">
            {THAI_MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => handleMonthChange(index)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${currentMonth === index ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
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
      <div className="relative h-full" ref={yearRef}>
        <button
          type="button"
          onClick={() => setIsYearOpen(!isYearOpen)}
          className={`flex h-full min-w-28 items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:outline-none ${isYearOpen ? "border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
        >
          <span>{currentYear + 543}</span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isYearOpen ? "rotate-180 text-indigo-500" : ""}`}
          />
        </button>
        {isYearOpen && (
          <div className="custom-scrollbar animate-in fade-in zoom-in-95 absolute top-[calc(100%+4px)] left-0 z-20 max-h-75 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5 duration-100">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${currentYear === year ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
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
