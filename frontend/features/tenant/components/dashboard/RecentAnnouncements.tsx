"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Megaphone, ChevronRight } from "lucide-react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { formatThaiDate } from "@/lib/dateFormatter";
import { routes } from "@/config/routes";

interface Announcement {
  id: string;
  title: string;
  type: "URGENT" | "IMPORTANT" | "NORMAL";
  createdAt: string;
}

export default function RecentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchAnnouncements = async () => {
      try {
        const res = await AnnouncementService.tenantGetAnnouncements({
          limit: 3,
        });
        if (isMountedRef.current) setAnnouncements(res.data);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    fetchAnnouncements();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Megaphone size={18} className="text-indigo-500" />
          ประกาศจากหอพัก
        </h3>
        <Link
          href={routes.tenant.announcements}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          ดูทั้งหมด
        </Link>
      </div>
      <div className="space-y-3">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))
        ) : announcements.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            ยังไม่มีประกาศจากหอพัก
          </p>
        ) : (
          announcements.map((item) => (
            <Link
              key={item.id}
              href={routes.tenant.announcements}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100"
            >
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.type === "URGENT" ? "bg-red-500" : item.type === "IMPORTANT" ? "bg-amber-500" : "bg-slate-300"}`}
                />
                <div>
                  <p className="line-clamp-1 text-sm font-medium text-slate-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatThaiDate(item.createdAt)}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
