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
    <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
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
              className="bg-skeleton h-14 animate-pulse rounded-xl"
            />
          ))
        ) : announcements.length === 0 ? (
          <p className="text-muted py-4 text-center text-sm">
            ยังไม่มีประกาศจากหอพัก
          </p>
        ) : (
          announcements.map((item) => (
            <Link
              key={item.id}
              href={routes.tenant.announcements}
              className="border-border bg-background hover:bg-surface flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors"
            >
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.type === "URGENT" ? "bg-red-500" : item.type === "IMPORTANT" ? "bg-amber-500" : "bg-muted"}`}
                />
                <div>
                  <p className="text-foreground line-clamp-1 text-sm font-medium">
                    {item.title}
                  </p>
                  <p className="text-muted text-xs">
                    {formatThaiDate(item.createdAt)}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
