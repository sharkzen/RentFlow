"use client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  defaults,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
ChartJS.register(ArcElement, Tooltip, Legend);
defaults.font.family =
  "var(--font-ibm-plex-thai), 'IBM Plex Sans Thai', sans-serif";

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
  const hasData = open > 0 || inProgress > 0 || completed > 0;

  const chartData = {
    labels: hasData
      ? ["รอรับเรื่อง", "กำลังซ่อม", "เสร็จสิ้น"]
      : ["ไม่มีข้อมูล"],

    datasets: [
      {
        data: hasData ? [open, inProgress, completed] : [1],
        backgroundColor: hasData
          ? ["#ef4444", "#f97316", "#22c55e"]
          : ["#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,

    plugins: {
      legend: {
        position: "bottom" as const,

        labels: {
          usePointStyle: true,
          padding: 20,

          font: {
            family: defaults.font.family,
          },
        },
      },

      tooltip: {
        enabled: hasData,

        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return ` ${label}: ${value} รายการ`;
          },
        },

        backgroundColor: "#fff",
        titleColor: "#111",
        bodyColor: "#111",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        cornerRadius: 8,

        bodyFont: {
          family: defaults.font.family,
        },
      },
    },
  };

  const chartKey = `${open}-${inProgress}-${completed}`;

  return (
    <div className="flex h-full w-full flex-col justify-center">
      <h3 className="text-muted mb-2 text-center text-sm font-semibold">
        สัดส่วนสถานะการแจ้งซ่อม
      </h3>
      <div className="relative h-64 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartKey}
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="h-full w-full"
          >
            <Pie data={chartData} options={options} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
