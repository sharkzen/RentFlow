"use client";

import React, { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import Image from "next/image";

interface DormHeroSliderProps {
  images: {
    url?: string;
    isCover: boolean;
  }[];
}

export const DormHeroSlider: React.FC<DormHeroSliderProps> = ({ images }) => {
  const sortedImages = [...(images || [])]
    .filter((img) => !!img.url)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const prevSlide = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) =>
        prev === 0 ? sortedImages.length - 1 : prev - 1,
      );
    },
    [sortedImages.length],
  );

  const nextSlide = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) =>
        prev === sortedImages.length - 1 ? 0 : prev + 1,
      );
    },
    [sortedImages.length],
  );

  if (!sortedImages.length) {
    return (
      <div className="bg-skeleton text-muted mx-auto mb-4 flex aspect-video max-h-125 w-full max-w-7xl flex-col items-center justify-center rounded-xl">
        <ImageIcon size={48} className="mb-3 opacity-30" strokeWidth={1.5} />
        <span className="text-sm font-medium">ไม่มีรูปภาพแสดง</span>
      </div>
    );
  }

  return (
    <>
      {/* Container หลัก: กำหนด max-w และจัดกึ่งกลาง */}
      <div className="mx-auto w-full max-w-7xl overflow-hidden py-5 md:ring-1 md:ring-white/10">
        {/* Main Image Container */}
        <div
          className="group relative w-full cursor-zoom-in overflow-hidden bg-black sm:rounded-2xl"
          style={{ aspectRatio: "16/9", maxHeight: "550px" }}
          onClick={() => setOpen(true)}
        >
          {sortedImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
            >
              {/* 1. ภาพพื้นหลังเบลอ (ทำหน้าที่เป็นฉากหลังกรณีที่ภาพหลักไม่เต็มกรอบ) */}
              <Image
                src={img.url || ""}
                alt="blurred background"
                fill
                quality={10} // คุณภาพต่ำได้เพราะเราจะทำเบลอ
                className="scale-110 object-cover opacity-50 blur-2xl" // ขยาย scale นิดนึงไม่ให้เห็นขอบเบลอ
                unoptimized={img.url?.includes("r2.cloudflarestorage.com")}
              />

              {/* 2. ภาพหลักแสดงผลแบบเต็มใบ ไม่ถูกตัด (object-contain) */}
              <Image
                src={img.url || ""}
                alt={`รูปที่ ${index + 1}`}
                fill
                priority={index === 0}
                quality={100} // ดันคุณภาพเต็ม 100 เพื่อความคมชัดสูงสุด
                className="object-contain drop-shadow-2xl" // เปลี่ยนจาก object-cover เป็น object-contain
                unoptimized={img.url?.includes("r2.cloudflarestorage.com")}
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-80" />
            </div>
          ))}

          {/* Prev / Next Buttons */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/70 active:scale-95 md:left-6 md:h-12 md:w-12"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/70 active:scale-95 md:right-6 md:h-12 md:w-12"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Bottom bar: Dots + Counter */}
          <div className="absolute right-4 bottom-4 left-4 z-20 flex items-center justify-between md:right-6 md:bottom-6 md:left-6">
            {/* Dots Indicator */}
            {sortedImages.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md">
                {sortedImages.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/90"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image Counter */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              className="ml-auto flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/80"
            >
              <Maximize2 size={16} />
              {currentIndex + 1} / {sortedImages.length}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentIndex}
        slides={sortedImages.map((img) => ({ src: img.url || "" }))}
        plugins={[Zoom]}
        on={{ view: ({ index }) => setCurrentIndex(index) }}
        animation={{ fade: 250 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};
