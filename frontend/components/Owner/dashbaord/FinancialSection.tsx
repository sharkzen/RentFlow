"use client";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { StatCard } from "./StatCard";

export const FinancialSection = ({ overview, monthLabel, year }: any) => {
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
        <DollarSign className="text-green-500" size={20} />
        สถานะการเงิน & ห้องพัก ({monthLabel} {year})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ชำระแล้ว (รายได้)"
          value={`฿${overview.bills.paid.amount.toLocaleString()}`}
          subValue={`${overview.bills.paid.count} บิล`}
          icon={<CheckCircle2 size={24} />}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard
          title="รอชำระ (ยังไม่จ่าย)"
          value={`฿${overview.bills.pending.amount.toLocaleString()}`}
          subValue={`${overview.bills.pending.count} บิล`}
          icon={<Clock size={24} />}
          colorClass="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="เกินกำหนด (ค้างจ่าย)"
          value={`฿${overview.bills.overdue.amount.toLocaleString()}`}
          subValue={`${overview.bills.overdue.count} บิล`}
          icon={<AlertCircle size={24} />}
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard
          title="ห้องพักที่มีผู้เช่า"
          value={`${overview.rooms.occupied} / ${overview.rooms.total}`}
          subValue={`ว่าง ${overview.rooms.available} ห้อง`}
          icon={<Users size={24} />}
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>
    </div>
  );
};
