import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorVariants: Record<string, string> = {
    green: "from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-50",
    blue: "from-blue-500 to-indigo-500 text-blue-600 bg-blue-50",
    purple: "from-purple-500 to-violet-500 text-purple-600 bg-purple-50",
    orange: "from-orange-500 to-amber-500 text-orange-600 bg-orange-50",
  };

  const activeColor = colorVariants[color] || colorVariants.blue;
  const [gradient, textInfo, bgInfo] = activeColor.split(" ");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/10">
      <div className="relative z-10 flex justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-sm ${gradient}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${gradient.replace("from-", "bg-")}`}
      ></div>
    </div>
  );
}
