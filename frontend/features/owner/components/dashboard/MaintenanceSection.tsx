"use client";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { Wrench, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const MaintenanceCard = ({ title, value, total, color, icon }: any) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colors: any = {
    gray: {
      text: "text-foreground",
      bg: "bg-muted",
      bgLight: "bg-background",
      icon: "text-muted",
    },

    red: {
      text: "text-red-600",
      bg: "bg-red-500",
      bgLight: "bg-red-100",
      icon: "text-red-400",
    },

    orange: {
      text: "text-orange-600",
      bg: "bg-orange-500",
      bgLight: "bg-orange-100",
      icon: "text-orange-400",
    },

    green: {
      text: "text-green-600",
      bg: "bg-green-500",
      bgLight: "bg-green-100",
      icon: "text-green-400",
    },
  };

  const theme = colors[color] || colors.gray;

  return (
    <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-muted font-medium">{title}</span>
        <div className={theme.icon}>{icon}</div>
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${theme.text}`}>
        <AnimatedNumber value={value} />
      </div>
      <div className={`mt-2 h-1.5 w-full rounded-full ${theme.bgLight}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${theme.bg}`}
          style={{
            width: `${percentage}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export const MaintenanceSection = ({ overview, monthLabel, year }: any) => {
  const total = overview?.maintenance.total;

  return (
    <div>
      <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
        <Wrench className="text-orange-500" size={20} />
        การแจ้งซ่อม ({monthLabel} {year})
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-4">
        <Link href={`/owner/maintenance?filter=ALL&dormId=${overview?.dormId}`}>
          <MaintenanceCard
            title="แจ้งซ่อมทั้งหมด"
            value={total}
            total={total}
            color="gray"
            icon={<FileText size={20} />}
          />
        </Link>
        <Link
          href={`/owner/maintenance?filter=OPEN&dormId=${overview?.dormId}`}
        >
          <MaintenanceCard
            title="แจ้งแล้ว (รอรับเรื่อง)"
            value={overview?.maintenance.open}
            total={total}
            color="red"
            icon={<AlertCircle size={20} />}
          />
        </Link>
        <Link
          href={`/owner/maintenance?filter=IN_PROGRESS&dormId=${overview?.dormId}`}
        >
          <MaintenanceCard
            title="กำลังดำเนินการ"
            value={overview?.maintenance.inProgress}
            total={total}
            color="orange"
            icon={<Wrench size={20} />}
          />
        </Link>
        <Link
          href={`/owner/maintenance?filter=COMPLETED&dormId=${overview?.dormId}`}
        >
          <MaintenanceCard
            title="ซ่อมเสร็จแล้ว"
            value={overview?.maintenance.completed}
            total={total}
            color="green"
            icon={<CheckCircle2 size={20} />}
          />
        </Link>
      </div>
    </div>
  );
};
