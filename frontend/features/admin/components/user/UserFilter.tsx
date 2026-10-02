import React from "react";
import { Search, Filter, Users } from "lucide-react";
import { CustomSelect } from "@/lib/ui/CustomSelect";

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "สถานะทั้งหมด",
  },
  {
    value: "ACTIVE",
    label: "ใช้งานปกติ (Active)",
  },
  {
    value: "BANNED",
    label: "ถูกระงับ (Banned)",
  },
  {
    value: "PENDING",
    label: "รออนุมัติ (Pending)",
  },
];

export const ROLE_OPTIONS = [
  {
    value: "ALL",
    label: "ทุกบทบาท",
  },
  {
    value: "TENANT",
    label: "ลูกบ้าน (Tenant)",
  },
  {
    value: "OWNER",
    label: "เจ้าของหอ (Owner)",
  },
];

interface UserFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  role: string;
  onRoleChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export default function UserFilter({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: UserFilterProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="text-muted h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อ, อีเมล, เบอร์เจ้าของ, Line, ห้อง, ชื่อหอพัก, ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-foreground ring-border placeholder:text-muted block w-full rounded-lg border-0 py-2.5 pr-3 pl-10 ring-1 transition-shadow ring-inset focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:text-sm sm:leading-6"
        />
      </div>
      <div className="w-full md:w-52">
        <CustomSelect
          options={ROLE_OPTIONS}
          value={role}
          onChange={onRoleChange}
          icon={<Users size={16} />}
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
