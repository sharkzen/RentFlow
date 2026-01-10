"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GraphData {
  name: string;
  total: number;
  isCurrent?: boolean;
}

interface RevenueChartProps {
  data: GraphData[];
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;

  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}k`;

  return `฿${value}`;
};

export const RevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <h3 className="mb-4 text-center text-sm font-semibold text-gray-500">
        แนวโน้มรายได้ (Revenue Trend)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrencyShort}
            />
            <Tooltip
              cursor={{
                fill: "#f9fafb",
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value?: number) => [
                value?.toLocaleString() ?? "0",
                "รายได้",
              ]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCurrent ? "#2563eb" : "#60a5fa"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
