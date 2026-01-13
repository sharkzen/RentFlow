import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  Layers,
  ChevronDown,
  Check,
  Zap,
  Fan,
} from "lucide-react";

interface RoomFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  floorFilter: string;
  setFloorFilter: (val: string) => void;
}

interface FilterDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
  placeholder: string;
  icon?: React.ReactNode;
}

function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 min-w-35 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm font-medium transition-all hover:bg-gray-50 focus:outline-none ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"} ${value !== "ALL" ? "text-blue-600" : "text-gray-700"}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-full min-w-[160px] rounded-xl border border-gray-100 bg-white p-1 shadow-lg duration-100">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${value === option.value ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-2">
                {option.icon && (
                  <span
                    className={
                      value === option.value ? "text-blue-500" : "text-gray-400"
                    }
                  >
                    {option.icon}
                  </span>
                )}
                {option.label}
              </div>
              {value === option.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoomFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  floorFilter,
  setFloorFilter,
}: RoomFiltersProps) {
  const statusOptions = [
    {
      label: "ทุกสถานะ",
      value: "ALL",
    },
    {
      label: "ว่าง",
      value: "AVAILABLE",
    },
    {
      label: "มีผู้เช่า",
      value: "OCCUPIED",
    },
    {
      label: "ปิดปรับปรุง",
      value: "MAINTENANCE",
    },
  ];

  const typeOptions = [
    {
      label: "ทุกประเภท",
      value: "ALL",
    },
    {
      label: "แอร์",
      value: "AIR",
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    {
      label: "พัดลม",
      value: "FAN",
      icon: <Fan className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขห้อง..."
          className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-9 text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative w-24 sm:w-28">
          <Layers className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            placeholder="ชั้น"
            className="h-10 w-full rounded-lg border border-gray-200 pr-3 pl-9 text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="สถานะ"
          icon={<Filter className="h-4 w-4" />}
        />
        <FilterDropdown
          value={typeFilter}
          onChange={setTypeFilter}
          options={typeOptions}
          placeholder="ประเภท"
        />
      </div>
    </div>
  );
}
