import { Search, Filter, ChevronDown, Check } from "lucide-react";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { useState } from "react";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
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
  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label || "สถานะ";

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-3 md:flex md:items-center md:justify-between lg:p-4">
      <div className="relative w-full md:max-w-xs">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาเลขห้อง"
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-4 pl-9 text-sm transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <MonthYearPicker value={selectedMonth} onChange={onMonthChange} />
        </div>
        <div className="hidden h-6 w-px bg-gray-200 sm:block"></div>

        <div className="relative w-full min-w-35 sm:w-auto">
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm hover:border-gray-300 focus:ring-2 focus:ring-indigo-100"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-500" />
              <span className="text-gray-700">{currentStatusLabel}</span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {isStatusOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsStatusOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-white p-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onStatusChange(opt.value);
                      setIsStatusOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span className={opt.color}>{opt.label}</span>
                    {statusFilter === opt.value && (
                      <Check size={14} className="text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
