"use client";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { StatCard } from "./StatCard";
import Link from "next/link";

export const FinancialSection = ({ overview, monthLabel, year }: any) => {
  if (!overview || !overview.bills) return null;

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
        <DollarSign className="text-green-500" size={20} />
        สถานะการเงิน & ห้องพัก ({monthLabel} {year})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={"/owner/bills?filter=PAID"}>
          <StatCard
            title="ชำระแล้ว (รายได้)"
            value={`฿${(overview.bills.paid?.amount ?? 0).toLocaleString()}`}
            subValue={`${overview.bills.paid?.count ?? 0} บิล`}
            icon={<CheckCircle2 size={24} />}
            colorClass="bg-green-100 text-green-600"
          />
        </Link>

        <Link href={"/owner/bills?filter=PENDING"}>
          <StatCard
            title="รอชำระ (ยังไม่จ่าย)"
            value={`฿${(overview.bills.pending?.amount ?? 0).toLocaleString()}`}
            subValue={`${overview.bills.pending?.count ?? 0} บิล`}
            icon={<Clock size={24} />}
            colorClass="bg-yellow-100 text-yellow-600"
          />
        </Link>

        <Link href={"/owner/bills?filter=WAITING_FOR_VERIFICATION"}>
          <StatCard
            title="รอตรวจสอบ"
            value={`฿${(overview.bills.waiting?.amount ?? 0).toLocaleString()}`}
            subValue={`${overview.bills.waiting?.count ?? 0} บิล`}
            icon={<Search size={24} />}
            colorClass="bg-blue-100 text-blue-600"
          />
        </Link>

        <Link href={"/owner/bills?filter=OVERDUE"}>
          <StatCard
            title="เกินกำหนด (ค้างจ่าย)"
            value={`฿${(overview.bills.overdue?.amount ?? 0).toLocaleString()}`}
            subValue={`${overview.bills.overdue?.count ?? 0} บิล`}
            icon={<AlertCircle size={24} />}
            colorClass="bg-red-100 text-red-600"
          />
        </Link>
      </div>
    </div>
  );
};
