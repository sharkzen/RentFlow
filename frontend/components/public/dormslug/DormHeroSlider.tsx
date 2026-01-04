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
  // กรองและเรียงรูปภาพ
  const sortedImages = [...(images || [])]
    .filter((img) => !!img.url)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Preload Images logic (Optional: เพื่อความชัวร์ว่ารูปแรกมาไว)
  useEffect(() => {
    if (sortedImages.length > 0) {
      const img = new Image();
      img.src = sortedImages[0].url || "";
    }
  }, [sortedImages]);

  // กรณีไม่มีรูป
  if (!sortedImages.length) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center bg-gray-100 text-gray-400">
        <ImageIcon size={48} />
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
      <div className="group relative mx-auto aspect-video max-w-375 p-4 py-8">
        {sortedImages.map((img, index) => (
          <div
            key={index}
            onClick={() => setOpen(true)}
            className={`absolute inset-0 h-full w-full cursor-zoom-in px-4 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <img
              src={img.url || ""}
              alt={`Slide ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        <div className="pointer-events-none absolute top-4 right-4 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm">
            <Maximize2 size={20} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between p-4">
          <button
            onClick={prevSlide}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-white hover:text-black active:scale-90 md:h-12 md:w-12"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-white hover:text-black active:scale-90 md:h-12 md:w-12"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {sortedImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full shadow-sm transition-all ${
                i === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        <div className="absolute right-4 bottom-4 z-20 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
          {currentIndex + 1} / {sortedImages.length}
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentIndex}
        slides={sortedImages.map((img) => ({ src: img.url || "" }))}
        plugins={[Zoom]}
        on={{
          view: ({ index }) => setCurrentIndex(index),
        }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};
