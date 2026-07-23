"use client";
import { useState, useEffect } from "react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Bell,
  Info,
  X,
} from "lucide-react";
import { formatThaiDate } from "@/lib/dateFormatter";

const SESSION_DISMISSED_KEY = "dismissedAnnouncementIds";

const getSessionDismissedIds = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
};

const addSessionDismissedIds = (ids: string[]) => {
  const merged = Array.from(new Set([...getSessionDismissedIds(), ...ids]));
  sessionStorage.setItem(SESSION_DISMISSED_KEY, JSON.stringify(merged));
};

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "URGENT" | "IMPORTANT" | "NORMAL";
  createdAt: string;
  isPinned: boolean;
  isRead: boolean;
  images: {
    id: string;
    url: string;
  }[];
}

export default function TenantAnnouncementModal() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowFor24h, setDontShowFor24h] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const hideUntil = localStorage.getItem("hideAnnouncementsUntil");

      if (hideUntil && new Date().getTime() < parseInt(hideUntil, 10)) {
        return;
      }

      try {
        const res = await AnnouncementService.tenantGetAnnouncements({
          limit: 50,
        });

        const data: Announcement[] = res.data;
        const sessionDismissedIds = getSessionDismissedIds();

        let unread = data.filter(
          (a) => !a.isRead && !sessionDismissedIds.includes(a.id),
        );

        if (unread.length > 0) {
          const typeWeight = {
            URGENT: 3,
            IMPORTANT: 2,
            NORMAL: 1,
          };

          unread.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

            if (typeWeight[a.type] !== typeWeight[b.type]) {
              return typeWeight[b.type] - typeWeight[a.type];
            }

            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          setAnnouncements(unread);
          setIsOpen(true);
          setDisplayIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  const triggerNavigation = (
    targetIndex: number,
    moveDirection: "next" | "prev",
  ) => {
    if (isAnimating) return;

    setDirection(moveDirection);
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex(targetIndex);
      setDisplayIndex(targetIndex);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      triggerNavigation(currentIndex + 1, "next");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      triggerNavigation(currentIndex - 1, "prev");
    }
  };

  const handleAcknowledge = async () => {
    const currentAnn = announcements[currentIndex];
    setLoading(true);

    try {
      await AnnouncementService.tenantMarkAsRead(currentAnn.id);

      if (currentIndex < announcements.length - 1) {
        triggerNavigation(currentIndex + 1, "next");
      } else {
        closeModal();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    const currentAnn = announcements[displayIndex];

    if (dontShowAgain) {
      setLoading(true);

      try {
        await AnnouncementService.tenantMarkAsRead(currentAnn.id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      } finally {
        setLoading(false);
      }
    } else if (dontShowFor24h) {
      const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem("hideAnnouncementsUntil", tomorrow.toString());
    } else {
      // ไม่ได้ติ๊กอะไรเลย - อย่างน้อยกันไม่ให้ popup ผุดขึ้นซ้ำในเซสชันนี้
      addSessionDismissedIds(announcements.map((a) => a.id));
    }

    closeModal();
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen || announcements.length === 0) return null;

  const currentAnn = announcements[displayIndex];

  const typeConfig = {
    URGENT: {
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "ประกาศด่วนที่สุด",
    },

    IMPORTANT: {
      icon: Bell,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "ประกาศสำคัญ",
    },

    NORMAL: {
      icon: Info,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "ประกาศทั่วไป",
    },
  };

  const config = typeConfig[currentAnn.type] || typeConfig.NORMAL;
  const Icon = config.icon;

  const getAnimationClass = () => {
    if (!isAnimating) return "translate-x-0 opacity-100 scale-100";

    if (direction === "next") {
      return "-translate-x-4 opacity-0 scale-95";
    } else {
      return "translate-x-4 opacity-0 scale-95";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-all duration-300">
      <div className="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300">
        <div
          className={`flex items-center justify-between border-b px-6 py-4 transition-colors duration-300 ${config.bg} ${config.border}`}
        >
          <div className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 transition-transform duration-300 ${config.color}`}
            />
            <span className={`text-sm font-bold md:text-base ${config.color}`}>
              {config.label}
            </span>
            {currentAnn.isPinned && (
              <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm md:text-xs">
                ปักหมุด
              </span>
            )}
            <div className="text-xs">
              เมื่อ {formatThaiDate(currentAnn.createdAt)}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            title="ปิดหน้าต่างนี้ (ยังไม่นับว่าอ่านประกาศ เว้นแต่ติ๊กตัวเลือกด้านล่าง)"
            className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className={`transform transition-all duration-300 ease-out ${getAnimationClass()}`}
          >
            <h2 className="mb-4 text-lg leading-snug font-bold text-gray-900 md:text-xl">
              {currentAnn.title}
            </h2>
            {currentAnn.images && currentAnn.images.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-xl bg-slate-50 shadow-inner">
                <img
                  src={currentAnn.images[0].url}
                  alt="Announcement Attachment"
                  className="h-auto max-h-60 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-line text-gray-600 md:text-base">
              {currentAnn.content}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex flex-col gap-1.5 text-xs text-gray-500 md:text-sm">
            <label className="group flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 transition-shadow focus:ring-blue-500/30"
                checked={dontShowFor24h}
                disabled={dontShowAgain}
                onChange={(e) => setDontShowFor24h(e.target.checked)}
              />
              <span className="transition-colors group-hover:text-gray-700">
                ปิดไว้ก่อน ไม่ต้องแสดงอีกภายใน 24 ชม.
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 transition-shadow focus:ring-blue-500/30"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span className="transition-colors group-hover:text-gray-700">
                ไม่ต้องแสดงอีกเลย (ยังดูย้อนหลังได้ที่หน้าประกาศ)
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="rounded bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm">
              {currentIndex + 1}/ {announcements.length}
            </span>
            <button
              onClick={handleClose}
              disabled={loading}
              className="cursor-pointer text-xs font-medium text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline disabled:cursor-not-allowed"
            >
              ปิดหน้าต่างนี้
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <button
                disabled={currentIndex === 0 || loading || isAnimating}
                onClick={handlePrev}
                className="rounded-xl border bg-white p-2.5 text-gray-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                disabled={
                  currentIndex === announcements.length - 1 ||
                  loading ||
                  isAnimating
                }
                onClick={handleNext}
                className="rounded-xl border bg-white p-2.5 text-gray-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleAcknowledge}
              disabled={loading || isAnimating}
              title="มาร์คว่าอ่านประกาศฉบับนี้แล้วอย่างถาวร"
              className="flex-1 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 disabled:shadow-none disabled:active:scale-100 md:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  กำลังบันทึก...
                </span>
              ) : currentIndex < announcements.length - 1 ? (
                "✓ รับทราบประกาศนี้ ไปฉบับถัดไป"
              ) : (
                "✓ รับทราบประกาศนี้"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
