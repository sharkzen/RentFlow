"use client";
import React, { useState } from "react";
import { X, Droplets, Zap, CameraOff, ArrowRight } from "lucide-react";
import { IBillDetail } from "../types";
import { useScrollLock } from "usehooks-ts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: IBillDetail;
}

export default function MeterImageViewerModal({
  isOpen,
  onClose,
  bill,
}: Props) {
  useScrollLock();
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const images = bill.meterImages || {
    water: {
      current: null,
      previous: null,
    },

    electric: {
      current: null,
      previous: null,
    },
  };

  const ImageCard = ({
    title,
    url,
    unit,
  }: {
    title: string;
    url: string | null;
    unit: number;
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-semibold">{title}</span>
        <span className="bg-background text-foreground rounded-md px-2 py-1 text-xs font-bold">
          {unit.toLocaleString()}หน่วย
        </span>
      </div>
      {url ? (
        <div
          onClick={() => setFullScreenImage(url)}
          className="border-border bg-background group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border transition-all hover:border-indigo-400 hover:shadow-md"
        >
          <img
            src={url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>
      ) : (
        <div className="border-border bg-background text-muted flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
          <CameraOff size={24} />
          <span className="text-xs font-medium">ไม่มีรูปภาพ</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className="animate-in fade-in fixed inset-0 z-100 flex bg-slate-900/60 duration-200 sm:items-center sm:justify-center"
        onClick={onClose}
      >
        <div
          className="bg-surface animate-in zoom-in-95 relative flex max-h-screen w-full max-w-4xl flex-col overflow-hidden shadow-2xl duration-200 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 className="text-foreground text-lg font-bold">
                หลักฐานรูปถ่ายมิเตอร์
              </h3>
              <p className="text-muted text-xs">
                เปรียบเทียบการจดมิเตอร์ ห้อง {bill.roomNumberSnapshot}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-background text-muted hover:bg-border hover:text-foreground cursor-pointer rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
                <div className="mb-4 flex items-center gap-2 text-amber-600">
                  <Zap size={20} fill="currentColor" />
                  <h4 className="font-bold">มิเตอร์ไฟฟ้า</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ImageCard
                    title="เดือนก่อน"
                    url={images.electric.previous}
                    unit={bill.prevElectricUnitSnapshot}
                  />
                  <div className="relative">
                    <div className="absolute top-[50%] -left-5 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1 text-amber-400 shadow-sm ring-1 ring-amber-100 sm:block">
                      <ArrowRight size={16} />
                    </div>
                    <ImageCard
                      title="เดือนนี้"
                      url={images.electric.current}
                      unit={bill.currentElectricUnitSnapshot}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                <div className="mb-4 flex items-center gap-2 text-blue-600">
                  <Droplets size={20} fill="currentColor" />
                  <h4 className="font-bold">มิเตอร์น้ำประปา</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ImageCard
                    title="เดือนก่อน"
                    url={images.water.previous}
                    unit={bill.prevWaterUnitSnapshot}
                  />
                  <div className="relative">
                    <div className="absolute top-[50%] -left-5 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1 text-blue-400 shadow-sm ring-1 ring-blue-100 sm:block">
                      <ArrowRight size={16} />
                    </div>
                    <ImageCard
                      title="เดือนนี้ (ล่าสุด)"
                      url={images.water.current}
                      unit={bill.currentWaterUnitSnapshot}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {fullScreenImage && (
        <div
          className="animate-in fade-in fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30 sm:top-6 sm:right-6"
          >
            <X size={24} />
          </button>
          <img
            src={fullScreenImage}
            alt="Meter Fullscreen"
            className="animate-in zoom-in max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
