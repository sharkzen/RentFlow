"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

const DESKTOP_STEPS = [
  {
    src: "/images/tutorial/desktop/1.png",
    label: "1. เปิด Google Maps คลิกขวาตำแหน่งที่ต้องการปักหมุด",
  },
  {
    src: "/images/tutorial/desktop/2.png",
    label: "2. เลือก Share this location",
  },
  {
    src: "/images/tutorial/desktop/3.png",
    label: "3. กด COPY LINK",
  },
];

const MOBILE_STEPS = [
  {
    src: "/images/tutorial/mobile/1.jpg",
    label: "1. เข้าสู่ Google Maps ผ่านบราวเซอร์ และหาตำแหน่งที่ต้องการ",
  },
  {
    src: "/images/tutorial/mobile/2.jpg",
    label: "2. แตะค้างที่ตำแหน่งที่ต้องการเพื่อปักหมุด",
  },
  {
    src: "/images/tutorial/mobile/3.jpg",
    label: "3. เลือกที่ url ด้านบน",
  },
  {
    src: "/images/tutorial/mobile/4.jpg",
    label: "4. คัดลอกลิงก์",
  },
];

export default function MapTutorialContent() {
  const [tab, setTab] = useState<"desktop" | "mobile">("desktop");
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setTab("mobile");
    }
  }, []);

  const steps = tab === "desktop" ? DESKTOP_STEPS : MOBILE_STEPS;

  useEffect(() => {
    setActiveIndex(0);

    trackRef.current?.scrollTo({
      left: 0,
    });
  }, [tab]);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;

    if (!track) return;

    const slideWidth = track.clientWidth;

    if (!slideWidth) return;

    const index = Math.round(track.scrollLeft / slideWidth);
    setActiveIndex(index);
  }, []);

  const goTo = (index: number) => {
    const track = trackRef.current;

    if (!track) return;

    const clamped = Math.max(0, Math.min(steps.length - 1, index));

    track.scrollTo({
      left: clamped * track.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="border-border flex shrink-0 border-b">
        <button
          type="button"
          onClick={() => setTab("desktop")}
          className={`flex-1 cursor-pointer pb-2 text-center text-sm font-medium transition-colors ${tab === "desktop" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted hover:text-foreground"}`}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setTab("mobile")}
          className={`flex-1 cursor-pointer pb-2 text-center text-sm font-medium transition-colors ${tab === "mobile" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted hover:text-foreground"}`}
        >
          มือถือ
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
            style={{
              scrollbarWidth: "none",
            }}
          >
            {steps.map((step) => (
              <div
                key={step.src}
                className="flex h-full w-full shrink-0 snap-center items-center justify-center px-2"
              >
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  aria-label="ขยายรูปภาพ"
                  className="border-border group relative aspect-[9/19.5] h-full max-h-[65vh] w-auto max-w-full cursor-zoom-in overflow-hidden rounded-2xl border-4 bg-slate-200 shadow-lg dark:bg-slate-800"
                >
                  <Image
                    className="object-contain"
                    src={step.src}
                    alt={step.label}
                    fill
                    sizes="100vw"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                      <ZoomIn size={20} />
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="bg-surface/90 hover:bg-surface text-foreground absolute top-1/2 left-1 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border shadow"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {activeIndex < steps.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="bg-surface/90 hover:bg-surface text-foreground absolute top-1/2 right-1 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border shadow"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {steps.map((step, index) => (
            <button
              key={step.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`ไปยังขั้นตอนที่ ${index + 1}`}
              className={`h-2 cursor-pointer rounded-full transition-all ${index === activeIndex ? "w-5 bg-blue-600" : "bg-border w-2 hover:bg-blue-300"}`}
            />
          ))}
        </div>
        <p className="text-foreground shrink-0 text-center text-sm font-medium">
          {steps[activeIndex].label}
        </p>
      </div>
      <p className="text-muted shrink-0 text-center text-sm">
        {tab === "desktop"
          ? "คลิกขวาที่ตำแหน่งบนแผนที่ > เลือก Share this location > กด COPY LINK"
          : "แตะค้างที่แผนที่จนขึ้นหมุดสีแดง > แล้วคัดลอกลิงก์ด้านบน"}
      </p>
      {zoomOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-10000 flex flex-col bg-black/90"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="ปิด"
              className="absolute top-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={22} />
            </button>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
              <div className="relative h-full w-full">
                <Image
                  className="object-contain"
                  src={steps[activeIndex].src}
                  alt={steps[activeIndex].label}
                  fill
                  sizes="100vw"
                  priority
                />
              </div>
              {activeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute top-1/2 left-2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {activeIndex < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute top-1/2 right-2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <p className="shrink-0 px-4 pb-6 text-center text-sm font-medium text-white">
              {steps[activeIndex].label}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}
