"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface DormHeroSliderProps {
  images: { url?: string; isCover: boolean }[];
}

export const DormHeroSlider: React.FC<DormHeroSliderProps> = ({ images }) => {
  const sortedImages = [...(images || [])]
    .filter((img) => !!img.url)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (!sortedImages.length) {
    return (
      <div className="flex h-100 w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
        <ImageIcon size={48} className="mb-2 opacity-50" />
        <span className="text-sm">ไม่มีรูปภาพแสดง</span>
      </div>
    );
  }

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1,
    );
  };

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      <div className="group relative mx-auto aspect-video w-full overflow-hidden bg-slate-900 md:aspect-21/9 lg:h-125">
        {sortedImages.map((img, index) => (
          <div
            key={index}
            onClick={() => setOpen(true)}
            className={`absolute inset-0 h-full w-full cursor-zoom-in transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <img
              src={img.url || ""}
              alt={`Slide ${index + 1}`}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-50" />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4 md:px-6">
          <button
            onClick={prevSlide}
            className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 active:scale-90 md:h-12 md:w-12"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 active:scale-90 md:h-12 md:w-12"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-black/60"
        >
          <Maximize2 size={14} />
          {currentIndex + 1} / {sortedImages.length} รูปภาพ
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {sortedImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentIndex}
        slides={sortedImages.map((img) => ({ src: img.url || "" }))}
        plugins={[Zoom]}
        on={{ view: ({ index }) => setCurrentIndex(index) }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};
