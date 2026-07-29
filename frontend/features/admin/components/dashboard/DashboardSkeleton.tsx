import React from "react";

export const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-8">
      <div className="bg-skeleton h-8 w-48 rounded-lg"></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-skeleton h-32 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-skeleton h-40 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="bg-skeleton h-80 rounded-2xl lg:col-span-2"></div>
        <div className="bg-skeleton h-64 rounded-2xl"></div>
      </div>
    </div>
  );
};
