"use client";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export const StatCard = ({
  title,
  value,
  subValue,
  icon,
  colorClass,
}: StatCardProps) => (
  <div className="flex items-start justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
      {subValue && (
        <p className="mt-1 text-xs font-medium text-gray-400">{subValue}</p>
      )}
    </div>
    <div className={`rounded-xl p-3 ${colorClass}`}>{icon}</div>
  </div>
);
