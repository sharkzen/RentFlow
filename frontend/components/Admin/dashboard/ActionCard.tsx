import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";

interface ActionCardProps {
  title: string;
  value: number;
  href: string;
  label: string;
  variant?: "warning" | "info";
}

export const ActionCard = ({
  title,
  value,
  href,
  label,
  variant = "warning",
}: ActionCardProps) => {
  const isWarning = variant === "warning";
  const bgClass = isWarning
    ? "bg-orange-50 border-orange-100"
    : "bg-blue-50 border-blue-100";
  const textTitleClass = isWarning ? "text-orange-900" : "text-blue-900";
  const textSubClass = isWarning ? "text-orange-600/80" : "text-blue-600/80";
  const btnClass = isWarning
    ? "text-orange-600 bg-white hover:bg-orange-100"
    : "text-blue-600 bg-white hover:bg-blue-100";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-5 transition-all ${bgClass}`}
    >
      <div>
        <h4 className={`text-2xl font-bold ${textTitleClass}`}>{value}</h4>
        <p className={`text-sm font-medium ${textSubClass}`}>{title}</p>
      </div>
      <Link
        href={href}
        className={`flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-colors ${btnClass}`}
      >
        {label} <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
};
