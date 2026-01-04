import React from "react";
import { CheckCircle2 } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

export const DormContent: React.FC<{ data: DormSlugResponse }> = ({ data }) => {
  const renderSection = (section: any) => {
    switch (section.type) {
      case "text":
        return (
          <p key={section.id} className="mb-4 leading-relaxed text-gray-600">
            {section.value}
          </p>
        );
      case "list":
        return (
          <ul
            key={section.id}
            className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-blue-50 bg-blue-50/30 p-4"
          >
            {section.items.map((item: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-3 font-medium text-gray-700"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-4xl">
          {data.name}
        </h1>
      </div>

      <div>
        <h3 className="mb-3 border-l-4 border-blue-500 pl-3 text-lg font-bold text-gray-900">
          รายละเอียด
        </h3>
        {data.description?.sections
          ?.sort((a: any, b: any) => a.order - b.order)
          .map(renderSection)}
      </div>
    </div>
  );
};
