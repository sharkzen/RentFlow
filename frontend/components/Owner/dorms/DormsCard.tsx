"use client";

import { Settings } from "lucide-react";
import { Dormitory } from "@/features/dormitory";
import { useState } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendErrorMsg";

interface DormsCardProps {
  dorm: Dormitory;
  onEdit: () => void;
  onTogglePublish?: (value: boolean) => void;
}

export default function DormsCard({ dorm, onEdit }: DormsCardProps) {
  const [published, setPublished] = useState(dorm.isPublished);

  const cover =
    dorm.images?.find((i) => i.isCover)?.url ?? dorm.images?.[0]?.url ?? null; // ⬅️ เปลี่ยนให้รู้ว่าจริง ๆ ไม่มีรูป

  const togglePublish = async () => {
    const next = !published;
    setPublished(next);

    try {
      await DormService.updateDormStatus(dorm.id, next);
    } catch (error: any) {
      setPublished(!next);
      log.error(error);
      showBackendError(error);
    }
  };

  return (
    <div className="flex h-full min-h-70 flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-video bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={dorm.name}
            className="h-62.5 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-62.5 w-full items-center justify-center text-lg font-semibold text-slate-400">
            No Image
          </div>
        )}

        <span
          className={`absolute top-3 left-3 rounded-full px-2 py-0.5 text-xs font-medium ${
            published ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
          }`}
        >
          {published ? "Public" : "Draft"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 max-h-10 text-sm leading-snug font-semibold text-slate-800">
            {dorm.name}
          </h3>

          <button
            onClick={onEdit}
            className="shrink-0 rounded-md bg-slate-100 p-1.5 text-slate-500 transition hover:cursor-pointer hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="แก้ไข"
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            สถานะ: {published ? "เผยแพร่" : "ร่าง"}
          </span>

          <button
            onClick={togglePublish}
            className={`relative h-5 w-9 rounded-full transition hover:cursor-pointer ${
              published ? "bg-emerald-500" : "bg-slate-400"
            }`}
            aria-label="เปลี่ยนสถานะ"
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                published ? "left-4" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
