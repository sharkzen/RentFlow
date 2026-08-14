import { Search, Filter, ChevronDown, Check, X, Calendar } from "lucide-react";
import MonthYearPicker from "@/lib/ui/MonthYearPicker";
import { useState, useRef, useEffect } from "react";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  selectedMonth: Date | null;
  onMonthChange: (date: Date | null) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  statusOptions: {
    label: string;
    value: string;
    color: string;
  }[];
}

export default function BillFilters({
  search,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  statusFilter,
  onStatusChange,
  statusOptions,
}: Props) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    "สถานะทั้งหมด";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xs">
        <Search className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาเลขห้อง..."
          className="border-border bg-background placeholder:text-muted focus:bg-surface h-10 w-full rounded-lg border pr-4 pl-10 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          {selectedMonth ? (
            <div className="flex h-10 w-full items-center gap-1 rounded-lg sm:w-auto">
              <MonthYearPicker value={selectedMonth} onChange={onMonthChange} />
              <button
                onClick={() => onMonthChange(null)}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                title="ล้างตัวเลือกเดือน"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onMonthChange(new Date())}
              className="border-border text-muted flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-sm font-medium transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 sm:w-auto"
            >
              <Calendar size={16} />
              <span>กรองตามเดือน</span>
            </button>
          )}
        </div>
        <div className="bg-border hidden h-8 w-px lg:block" />
        <div className="relative w-full sm:w-48" ref={dropdownRef}>
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:ring-indigo-100 focus:outline-none ${isStatusOpen ? "bg-surface border-indigo-500 ring-2 ring-indigo-100" : "border-border bg-surface hover:border-muted hover:bg-background"}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Filter
                size={16}
                className={isStatusOpen ? "text-indigo-500" : "text-muted"}
              />
              <span
                className={`truncate ${statusFilter !== "ALL" ? "text-foreground font-medium" : "text-muted"}`}
              >
                {currentStatusLabel}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-muted shrink-0 transition-transform duration-200 ${isStatusOpen ? "rotate-180 text-indigo-500" : ""}`}
            />
          </button>
          {isStatusOpen && (
            <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-1 w-full min-w-[180px] origin-top-right overflow-hidden rounded-lg border p-1 shadow-xl ring-1 ring-black/5 sm:w-auto">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onStatusChange(opt.value);
                    setIsStatusOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${statusFilter === opt.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground hover:bg-background"}`}
                >
                  <span className={opt.color}>{opt.label}</span>
                  {statusFilter === opt.value && (
                    <Check size={16} className="text-indigo-600" />
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
