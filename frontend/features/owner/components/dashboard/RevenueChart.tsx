"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  defaults,
} from "chart.js";

import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);
defaults.font.family =
  "var(--font-ibm-plex-thai), 'IBM Plex Sans Thai', sans-serif";
defaults.color = "#64748b";

interface GraphData {
  name: string;
  total: number;
  isCurrent?: boolean;
}

interface RevenueChartProps {
  data: GraphData[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const chartData = {
    labels: data.map((d) => d.name),

    datasets: [
      {
        label: "รายได้",
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => (d.isCurrent ? "#2563eb" : "#60a5fa")),
        borderRadius: 4,
        barThickness: "flex" as const,
        maxBarThickness: 50,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";

            if (label) label += ": ";

            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
              }).format(context.parsed.y);
            }

            return label;
          },
        },

        backgroundColor: "#fff",
        titleColor: "#111",
        bodyColor: "#111",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,

        titleFont: {
          family: defaults.font.family,
        },

        bodyFont: {
          family: defaults.font.family,
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },

        ticks: {
          font: {
            family: defaults.font.family,
          },
        },
      },

      y: {
        grid: {
          color: "#f1f5f9",
        },

        border: {
          display: false,
          dash: [4, 4],
        },

        ticks: {
          font: {
            family: defaults.font.family,
          },

          callback: (value) => {
            const v = Number(value);

            if (v >= 1000000) return "฿" + (v / 1000000).toFixed(1) + "M";

            if (v >= 1000) return "฿" + (v / 1000).toFixed(0) + "k";

            return "฿" + v;
          },
        },
      },
    },
  };

  const chartKey = JSON.stringify(data);

  return (
    <div className="flex h-full w-full flex-col justify-center">
      <h3 className="text-muted mb-4 text-center text-sm font-semibold">
        แนวโน้มรายได้ (Revenue Trend)
      </h3>
      <div className="h-64 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartKey}
            initial={{
              opacity: 0,
              y: 50,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            className="h-full w-full"
          >
            <Bar data={chartData} options={options} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
