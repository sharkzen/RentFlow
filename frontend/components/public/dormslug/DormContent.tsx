"use client";
import React from "react";
import { CheckCircle2 } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

export const DormContent: React.FC<{ data: DormSlugResponse }> = ({ data }) => {
  const renderSection = (section: any) => {
    switch (section.type) {
      case "text":
        return (
          <p
            key={section.id}
            className="mb-5 text-base leading-7 text-slate-600 md:text-[17px] md:leading-8"
          >
            {section.value}
          </p>
        );
      case "list":
        return (
          <div key={section.id} className="mb-8">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {section.items.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-500"
                  />
                  <span className="text-sm text-slate-700 md:text-base">
                    {item}
                  </span>
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {data.name}
        </h1>
      </div>

      <div>
        <h3 className="mb-5 text-lg font-semibold text-slate-900">
          รายละเอียดหอพัก
        </h3>
        <div>
          {data.description?.sections
            ?.sort((a: any, b: any) => a.order - b.order)
            .map(renderSection)}
        </div>
      </div>
    </div>
  );
};
