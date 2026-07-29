"use client";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  icon: React.ReactNode;
  colorClass: string;
  prefix?: string;
}

export const StatCard = ({
  title,
  value,
  subValue,
  icon,
  colorClass,
  prefix = "",
}: StatCardProps) => (
  <div className="border-border bg-surface flex items-start justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md">
    <div>
      <p className="text-muted text-sm font-medium">{title}</p>
      <h3 className="text-foreground mt-1 text-2xl font-bold">
        {prefix}
        <AnimatedNumber value={value} />
      </h3>
      {subValue !== undefined && (
        <p className="text-muted mt-1 text-xs font-medium">
          <AnimatedNumber value={subValue} />
          บิล
        </p>
      )}
    </div>
    <div className={` ${colorClass}`}>{icon}</div>
  </div>
);
