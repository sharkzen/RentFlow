import React from "react";
import { Search, Filter, X, Layers, ChevronDown } from "lucide-react";

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
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขห้อง..."
          className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="hidden h-6 w-px bg-gray-200 sm:block"></div>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative w-24 sm:w-28">
          <Layers className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            placeholder="ชั้น"
            className="h-full w-full rounded-lg border border-gray-200 pr-3 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="AVAILABLE">ว่าง</option>
            <option value="OCCUPIED">มีผู้เช่า</option>
            <option value="MAINTENANCE">ปิดปรับปรุง</option>
          </select>
          <Filter className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">ทุกประเภท</option>
            <option value="AIR">แอร์</option>
            <option value="FAN">พัดลม</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
