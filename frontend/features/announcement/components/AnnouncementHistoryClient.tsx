"use client";
import React, { useEffect, useState } from "react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";

import {
  AlertTriangle,
  Bell,
  Info,
  Calendar,
  Pin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";

interface AnnouncementImage {
  id: string;
  url?: string;
  bucket?: string;
  tenantId?: string | null;
  ownerId?: string | null;
  dormitoryId?: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "URGENT" | "IMPORTANT" | "NORMAL";
  createdAt: string;
  isPinned: boolean;
  isRead: boolean;
  images: AnnouncementImage[];
}

interface AnnouncementMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

interface AnnouncementResponse {
  data: Announcement[];
  meta: AnnouncementMeta;
}

const formatThaiDate = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case "URGENT":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        badgeBg: "bg-red-100",
        label: "ด่วนที่สุด",
      };
    case "IMPORTANT":
      return {
        icon: Bell,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badgeBg: "bg-amber-100",
        label: "สำคัญ",
      };
    default:
      return {
        icon: Info,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        badgeBg: "bg-blue-100",
        label: "ทั่วไป",
      };
  }
};

const CONTENT_PREVIEW_LENGTH = 220;

function AnnouncementHistoryCard({
  announcement,
  onImageClick,
}: {
  announcement: Announcement;
  onImageClick: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = getTypeConfig(announcement.type);
  const Icon = config.icon;
  const image = announcement.images?.[0];
  const isLong = announcement.content.length > CONTENT_PREVIEW_LENGTH;
  const displayContent =
    isLong && !expanded
      ? announcement.content.slice(0, CONTENT_PREVIEW_LENGTH).trimEnd() + "…"
      : announcement.content;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${announcement.isRead ? "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:shadow-sm" : "border-slate-200 bg-white shadow-sm hover:shadow-md"}`}
    >
      <div
        className={`absolute top-0 bottom-0 left-0 w-1.5 ${config.bg} ${config.color.replace("text-", "bg-")}`}
      ></div>
      <div className="flex flex-col gap-3 p-4 pl-5 sm:p-5 sm:pl-7">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badgeBg} ${config.color}`}
            >
              <Icon size={14} />
              {config.label}
            </span>
            {announcement.isPinned && (
              <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                <Pin size={12} className="fill-white" />
                ปักหมุด
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={14} />
            {formatThaiDate(announcement.createdAt)}
            {announcement.isRead && (
              <CheckCircle2 size={16} className="ml-1 text-green-500" />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {image?.url && (
            <button
              type="button"
              onClick={() => onImageClick(image.url!)}
              className="group/img relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-40 sm:aspect-square"
            >
              <img
                src={image.url}
                alt="รูปภาพประกอบประกาศ"
                className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/img:bg-black/30 group-hover/img:opacity-100">
                <ExternalLink size={18} className="text-white" />
              </div>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h3
              className={`text-base leading-snug font-bold sm:text-lg ${announcement.isRead ? "text-slate-700" : "text-slate-900"}`}
            >
              {announcement.title}
            </h3>
            <div
              className={`mt-2 text-sm leading-relaxed whitespace-pre-line ${announcement.isRead ? "text-slate-500" : "text-slate-600"}`}
            >
              {displayContent}
            </div>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 cursor-pointer text-xs font-semibold text-blue-600 hover:underline"
              >
                {expanded ? "ย่อข้อความ" : "อ่านเพิ่มเติม"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementHistoryClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<AnnouncementMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchAnnouncements = async (page: number) => {
    setIsLoading(true);

    try {
      const response: AnnouncementResponse =
        await AnnouncementService.tenantGetAnnouncements({
          limit: 10,
          page: page,
        });

      setAnnouncements(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(currentPage);
  }, [currentPage]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {!isLoading && meta && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-600">
            พบประกาศทั้งหมด{" "}
            <span className="text-base font-bold text-blue-600">
              {meta.total}
            </span>{" "}
            รายการ
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Pin size={14} className="text-slate-700" />
              ปักหมุด
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              อ่านแล้ว
            </span>
          </div>
        </div>
      )}
      <div className="space-y-3.5">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200"></div>
              </div>
              <div className="space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200"></div>
                <div className="h-4 w-full animate-pulse rounded bg-slate-100"></div>
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100"></div>
              </div>
            </div>
          ))
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <Bell size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">ยังไม่มีประกาศ</h3>
            <p className="mt-1 text-sm text-slate-500">
              หอพักของคุณยังไม่ได้สร้างประกาศใดๆ ในขณะนี้
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementHistoryCard
              key={announcement.id}
              announcement={announcement}
              onImageClick={setLightboxUrl}
            />
          ))
        )}
      </div>
      {!isLoading && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            <ChevronLeft size={16} />
            ก่อนหน้า
          </button>
          <span className="text-sm font-medium text-slate-500">
            หน้า {currentPage}จาก {meta.totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))
            }
            disabled={currentPage === meta.totalPages}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            ถัดไป
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt="รูปภาพประกอบประกาศ"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
