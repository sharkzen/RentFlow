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
            className="mb-6 text-base leading-relaxed text-slate-600 md:text-lg"
          >
            {section.value}
          </p>
        );
      case "list":
        return (
          <div key={section.id} className="mb-10">
            {/* Clean Grid Layout - No borders around items */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {section.items.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 py-1">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-500"
                  />
                  <span className="text-slate-700">{item}</span>
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
    <div className="bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {data.name}
        </h1>
        {/* สามารถเพิ่ม Location ย่อยตรงนี้ได้ถ้ามี data */}
      </div>

      <div>
        <h3 className="mb-6 text-xl font-semibold text-slate-900">
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
