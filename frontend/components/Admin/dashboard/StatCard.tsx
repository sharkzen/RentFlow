import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  subText?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  subText,
}: StatCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="z-10">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-800">
            {value.toLocaleString()}
          </h3>
          {subText && (
            <p className="mt-2 text-xs font-medium text-gray-400">{subText}</p>
          )}
        </div>
        <div
          className={`rounded-xl p-3 shadow-sm ${colorClass} text-white transition-transform group-hover:scale-110`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div
        className={`absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10 ${colorClass}`}
      />
    </div>
  );
};
