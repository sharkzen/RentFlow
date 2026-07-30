import { MaintenanceStatus } from "@/features/maintenance";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

interface Props {
  status: MaintenanceStatus;
}

export default function MaintenanceStatusBadge({ status }: Props) {
  const baseStyle =
    "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

  switch (status) {
    case "OPEN":
      return (
        <span
          className={`${baseStyle} bg-yellow-50 text-yellow-700 ring-yellow-600/20`}
        >
          <AlertCircle size={12} />
          รอรับเรื่อง
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span
          className={`${baseStyle} bg-blue-50 text-blue-700 ring-blue-700/10`}
        >
          <Clock size={12} />
          รับเรื่องแล้ว
        </span>
      );
    case "COMPLETED":
      return (
        <span
          className={`${baseStyle} bg-green-50 text-green-700 ring-green-600/20`}
        >
          <CheckCircle2 size={12} />
          ดำเนินการแล้ว
        </span>
      );
    case "CANCELLED":
      return (
        <span className={`${baseStyle} bg-background text-muted ring-border`}>
          <XCircle size={12} />
          ยกเลิก
        </span>
      );
    default:
      return <span>{status}</span>;
  }
}
