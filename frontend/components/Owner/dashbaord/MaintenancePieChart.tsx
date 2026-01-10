"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface MaintenancePieChartProps {
  open: number;
  inProgress: number;
  completed: number;
}

export const MaintenancePieChart = ({
  open,
  inProgress,
  completed,
}: MaintenancePieChartProps) => {
  const data = [
    {
      name: "รอรับเรื่อง",
      value: open,
      color: "#ef4444",
    },
    {
      name: "กำลังซ่อม",
      value: inProgress,
      color: "#f97316",
    },
    {
      name: "เสร็จสิ้น",
      value: completed,
      color: "#22c55e",
    },
  ];

  const hasData = data.some((d) => d.value > 0);

  const chartData = hasData
    ? data
    : [
        {
          name: "ไม่มีข้อมูล",
          value: 1,
          color: "#e5e7eb",
        },
      ];

  return (
    <div className="flex h-full w-full flex-col justify-center">
      <h3 className="mb-2 text-center text-sm font-semibold text-gray-500">
        สัดส่วนสถานะการแจ้งซ่อม
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
