import React from "react";
import { Search, Building2, Filter, Plus } from "lucide-react";

interface QrCodeFiltersProps {
  dorms: any[];
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
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 p-4 sm:p-6 lg:flex-row lg:items-center">
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:flex lg:w-auto">
        <div className="relative w-full lg:w-48 xl:w-56">
          <Building2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedDormId}
            onChange={(e) => setSelectedDormId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pr-8 pl-9 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="all" disabled>
              เลือกหอพัก
            </option>
            {dorms.map((dorm) => (
              <option key={dorm.id} value={dorm.id}>
                {dorm.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-44 xl:w-48">
          <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pr-8 pl-9 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="all">สถานะ QR (ทั้งหมด)</option>
            <option value="active">เปิดใช้งานอยู่</option>
            <option value="inactive">ปิดใช้งาน / ยังไม่สร้าง</option>
          </select>
        </div>

        <div className="relative w-full md:col-span-2 lg:col-span-1 lg:w-56 xl:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาห้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-9 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
      </div>

      <button
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={onBulkCreate}
        className={`flex w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors lg:w-auto ${
          selectedCount > 0 && !isBulkLoading
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            : "cursor-not-allowed bg-blue-600/50 text-white"
        }`}
      >
        <Plus className="h-4 w-4" />
        {isBulkLoading ? "กำลังสร้าง..." : `สร้าง (${selectedCount})`}
      </button>
    </div>
  );
}
