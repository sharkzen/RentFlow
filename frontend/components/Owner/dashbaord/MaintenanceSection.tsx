"use client";
import { Wrench, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

const MaintenanceCard = ({ title, value, total, color, icon }: any) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colors: any = {
    gray: {
      text: "text-gray-900",
      bg: "bg-gray-400",
      bgLight: "bg-gray-100",
      icon: "text-gray-400",
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-500">{title}</span>
        <div className={theme.icon}>{icon}</div>
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${theme.text}`}>
        {value}
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
  const total = overview.maintenance.total;

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
        <Wrench className="text-orange-500" size={20} />
        การแจ้งซ่อม ({monthLabel} {year})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MaintenanceCard
          title="แจ้งซ่อมทั้งหมด"
          value={total}
          total={total}
          color="gray"
          icon={<FileText size={20} />}
        />
        <MaintenanceCard
          title="แจ้งแล้ว (รอรับเรื่อง)"
          value={overview.maintenance.open}
          total={total}
          color="red"
          icon={<AlertCircle size={20} />}
        />
        <MaintenanceCard
          title="กำลังดำเนินการ"
          value={overview.maintenance.inProgress}
          total={total}
          color="orange"
          icon={<Wrench size={20} />}
        />
        <MaintenanceCard
          title="ซ่อมเสร็จแล้ว"
          value={overview.maintenance.completed}
          total={total}
          color="green"
          icon={<CheckCircle2 size={20} />}
        />
      </div>
    </div>
  );
};
