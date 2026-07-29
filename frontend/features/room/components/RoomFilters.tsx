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
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-surface hover:bg-background flex h-10 w-full min-w-35 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-sm font-medium transition-all focus:outline-none ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-border"} ${value !== "ALL" ? "text-blue-600" : "text-foreground"}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted">{icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`text-muted h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-full min-w-[160px] space-y-1 rounded-xl border p-1 duration-100">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${value === option.value ? "bg-blue-50 font-medium text-blue-600 dark:bg-gray-800" : "text-foreground hover:bg-background"}`}
            >
              <div className="flex items-center gap-2">
                {option.icon && (
                  <span
                    className={
                      value === option.value ? "text-blue-500" : "text-muted"
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
    <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขห้อง..."
          className="border-border w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="bg-border hidden h-8 w-px sm:block"></div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap">
        <div className="relative w-full sm:w-28">
          <Layers className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            placeholder="ชั้น"
            className="border-border h-10 w-full rounded-lg border pr-3 pl-9 text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-auto">
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="สถานะ"
            icon={<Filter className="h-4 w-4" />}
          />
        </div>
        <div className="col-span-2 w-full sm:col-span-1 sm:w-auto">
          <FilterDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
            placeholder="ประเภท"
          />
        </div>
      </div>
    </div>
  );
}
