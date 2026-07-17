import React from "react";
import { Search, ChevronDown, Filter } from "lucide-react";

interface UserFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export default function UserFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: UserFilterProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อเจ้าของ, อีเมล, หรือเบอร์โทรศัพท์..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full rounded-lg border-0 py-2.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 transition-shadow ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:text-sm sm:leading-6"
        />
      </div>
      <div className="relative w-full md:w-56">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Filter className="h-4 w-4 text-gray-500" />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="block w-full cursor-pointer appearance-none rounded-lg border-0 bg-white py-2.5 pr-10 pl-10 text-gray-900 ring-1 ring-gray-300 transition-shadow ring-inset focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:text-sm sm:leading-6"
        >
          <option value="ALL">สถานะทั้งหมด</option>
          <option value="ACTIVE">ใช้งานปกติ (Active)</option>
          <option value="BANNED">ถูกระงับ (Banned)</option>
          <option value="PENDING">รออนุมัติ (Pending)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
