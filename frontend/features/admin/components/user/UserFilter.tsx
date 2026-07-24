import React from "react";
import { Search, Filter } from "lucide-react";
import { CustomSelect } from "@/lib/ui/CustomSelect";

const STATUS_OPTIONS = [
  { value: "ALL", label: "สถานะทั้งหมด" },
  { value: "ACTIVE", label: "ใช้งานปกติ (Active)" },
  { value: "BANNED", label: "ถูกระงับ (Banned)" },
  { value: "PENDING", label: "รออนุมัติ (Pending)" },
];

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
      <div className="w-full md:w-56">
        <CustomSelect
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
          icon={<Filter size={16} />}
        />
      </div>
    </div>
  );
}
