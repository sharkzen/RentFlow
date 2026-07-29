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
  return (
    <div>
      <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
        <DollarSign className="text-green-500" size={20} />
        สถานะการเงิน & ห้องพัก ({monthLabel} {year})
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-4">
        <Link href={`/owner/bills?filter=PAID&dormId=${overview?.dormId}`}>
          <StatCard
            title="ชำระแล้ว (รายได้)"
            value={overview?.bills.paid?.amount ?? 0}
            subValue={overview?.bills.paid?.count ?? 0}
            icon={<CheckCircle2 size={20} />}
            colorClass="text-green-600"
            prefix="฿"
          />
        </Link>
        <Link href={`/owner/bills?filter=PENDING&dormId=${overview?.dormId}`}>
          <StatCard
            title="รอชำระ"
            value={overview?.bills.pending?.amount ?? 0}
            subValue={overview?.bills.pending?.count ?? 0}
            icon={<Clock size={20} />}
            colorClass="text-yellow-600"
            prefix="฿"
          />
        </Link>
        <Link
          href={`/owner/bills?filter=WAITING_FOR_VERIFICATION&dormId=${overview?.dormId}`}
        >
          <StatCard
            title="รอตรวจสอบ"
            value={overview?.bills.waiting?.amount ?? 0}
            subValue={overview?.bills.waiting?.count ?? 0}
            icon={<Search size={20} />}
            colorClass="text-blue-600"
            prefix="฿"
          />
        </Link>
        <Link href={`/owner/bills?filter=OVERDUE&dormId=${overview?.dormId}`}>
          <StatCard
            title="เกินกำหนด"
            value={overview?.bills.overdue?.amount ?? 0}
            subValue={overview?.bills.overdue?.count ?? 0}
            icon={<AlertCircle size={20} />}
            colorClass="text-red-600"
            prefix="฿"
          />
        </Link>
      </div>
    </div>
  );
};
