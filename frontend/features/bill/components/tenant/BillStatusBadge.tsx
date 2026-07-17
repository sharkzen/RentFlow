"use client";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  XCircle,
} from "lucide-react";
import { BillStatus } from "./types";

interface Props {
  status: BillStatus;
}

export default function BillStatusBadge({ status }: Props) {
  const config = {
    PENDING: {
      style: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <Clock size={14} />,
      label: "รอชำระ",
    },

    WAITING_FOR_VERIFICATION: {
      style: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Search size={14} />,
      label: "รอตรวจสอบ",
    },

    PAID: {
      style: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 size={14} />,
      label: "ชำระแล้ว",
    },

    OVERDUE: {
      style: "bg-rose-100 text-rose-700 border-rose-200",
      icon: <AlertCircle size={14} />,
      label: "เกินกำหนด",
    },

    CANCELLED: {
      style: "bg-slate-100 text-slate-500 border-slate-200",
      icon: <XCircle size={14} />,
      label: "ยกเลิก",
    },
  };

  const { style, icon, label } = config[status] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {icon}
      {label}
    </span>
  );
}
