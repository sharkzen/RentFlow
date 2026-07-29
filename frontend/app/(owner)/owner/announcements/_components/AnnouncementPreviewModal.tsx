"use client";
import React from "react";
import { X, AlertCircle } from "lucide-react";
import dayjs from "dayjs";

interface AnnouncementPreviewModalProps {
  item: any;
  onClose: () => void;
}

export default function AnnouncementPreviewModal({
  item,
  onClose,
}: AnnouncementPreviewModalProps) {
  const imageUrl = item.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/60 p-4 transition-opacity">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:top-8 sm:right-8"
      >
        <X size={24} />
      </button>
      <div className="bg-surface flex max-h-[85vh] w-full max-w-[340px] flex-col overflow-hidden">
        <div className="shrink-0 bg-blue-600 p-4 text-center font-medium text-white shadow-sm">
          แจ้งเตือนประกาศ
        </div>
        <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 space-y-4 overflow-y-auto p-5 pb-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${item.type === "URGENT" ? "bg-red-100 text-red-700" : item.type === "IMPORTANT" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
            >
              {item.type === "URGENT" ? <AlertCircle size={12} /> : null}
              {item.type === "URGENT"
                ? "ด่วนมาก"
                : item.type === "IMPORTANT"
                  ? "สำคัญ"
                  : "ประกาศทั่วไป"}
            </span>
            <span className="text-muted text-xs">
              {dayjs(item.createdAt).format("DD MMM YYYY HH:mm")}
            </span>
          </div>
          <h3 className="text-foreground text-base font-bold break-words">
            {item.title}
          </h3>
          {imageUrl && (
            <div className="border-border bg-background w-full shrink-0 overflow-hidden rounded-lg border">
              <img
                src={imageUrl}
                alt="Announcement"
                className="w-full object-contain"
              />
            </div>
          )}
          <div className="text-muted text-sm break-words whitespace-pre-wrap">
            {item.content}
          </div>
        </div>
        <div className="border-border bg-surface shrink-0 border-t p-4">
          <button
            onClick={onClose}
            className="bg-background text-foreground hover:bg-border w-full rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            รับทราบ / ปิดประกาศ
          </button>
        </div>
      </div>
    </div>
  );
}
