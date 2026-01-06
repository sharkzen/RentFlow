"use client";
import React from "react";
import { Check } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

export const DormContent: React.FC<{
  data: DormSlugResponse;
}> = ({ data }) => {
  const renderSection = (section: any) => {
    switch (section.type) {
      case "text":
        return (
          <p
            key={section.id}
            className="mb-6 text-base leading-relaxed text-slate-600 md:text-lg"
          >
            {section.value}
          </p>
        );
      case "list":
        return (
          <div key={section.id} className="mb-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.items.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-blue-100 hover:bg-blue-50/30"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
          {data.name}
        </h1>
      </div>
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          <span className="inline-block h-6 w-1 rounded-full bg-blue-500"></span>
          รายละเอียดหอพัก
        </h3>
        <div className="prose prose-slate max-w-none text-slate-600">
          {data.description?.sections
            ?.sort((a: any, b: any) => a.order - b.order)
            .map(renderSection)}
        </div>
      </div>
    </div>
  );
};
