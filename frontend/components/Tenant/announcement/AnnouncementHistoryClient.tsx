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

export default function AnnouncementHistoryClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<AnnouncementMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
      <div className="space-y-5">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
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
              <div className="mt-5 h-48 w-full animate-pulse rounded-xl bg-slate-100 sm:h-64"></div>
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
          announcements.map((announcement) => {
            const config = getTypeConfig(announcement.type);
            const Icon = config.icon;

            return (
              <div
                key={announcement.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${announcement.isRead ? "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:shadow-sm" : "border-slate-200 bg-white shadow-sm hover:shadow-md"}`}
              >
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 ${config.bg} ${config.color.replace("text-", "bg-")}`}
                ></div>
                <div className="flex flex-col gap-4 p-5 pl-6 sm:p-6 sm:pl-8">
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
                        <CheckCircle2
                          size={16}
                          className="ml-1 text-green-500"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`text-lg leading-snug font-bold sm:text-xl ${announcement.isRead ? "text-slate-700" : "text-slate-900"}`}
                    >
                      {announcement.title}
                    </h3>
                    <div
                      className={`mt-3 text-sm leading-relaxed whitespace-pre-line sm:text-base ${announcement.isRead ? "text-slate-500" : "text-slate-600"}`}
                    >
                      {announcement.content}
                    </div>
                  </div>
                  {announcement.images &&
                    announcement.images.length > 0 &&
                    announcement.images[0].url && (
                      <div className="mt-2 w-full">
                        <div className="group/img relative block w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <img
                            src={announcement.images[0].url}
                            alt="รูปภาพประกอบประกาศ"
                            className="h-auto max-h-[400px] w-full object-contain transition-transform duration-500 group-hover/img:scale-[1.02] sm:max-h-[500px]"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover/img:bg-black/20">
                            <span className="flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2.5 text-sm font-semibold text-slate-800 opacity-0 shadow-lg transition-opacity duration-300 group-hover/img:opacity-100">
                              <ExternalLink size={18} />
                              คลิกเพื่อดูรูปขนาดเต็ม
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          })
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
    </div>
  );
}
