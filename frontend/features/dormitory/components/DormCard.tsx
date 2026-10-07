"use client";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Star,
  Megaphone,
} from "lucide-react";

interface DormProps {
  slug: string;
  image?: string;
  title: string;
  location: string;
  distance?: string;
  price: number;
  availabilityStatus?: "AVAILABLE" | "FULL";
  isFeatured?: boolean;
  isPromoted?: boolean;
}

export default function DormCard({
  slug,
  image,
  title,
  location,
  distance,
  price,
  availabilityStatus,
  isFeatured,
  isPromoted,
}: DormProps) {
  const displayImage =
    image || "https://placehold.co/800x600/f3f4f6/9ca3af?text=No+Image";
  const isPlaceholder = displayImage.includes("placehold.co");
  const isFull = availabilityStatus === "FULL";
  const isAvailable = availabilityStatus === "AVAILABLE";
  const isNotSpecified = !isFull && !isAvailable;

  return (
    <Link href={`/dorms/${slug}`} className="group block h-full">
      <div className="border-border bg-surface relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 will-change-transform backface-hidden hover:-translate-y-1">
        <div className="bg-background relative aspect-4/3 w-full overflow-hidden">
          {isFull && <div className="absolute inset-0 z-10" />}
          {isFeatured ? (
            <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-md">
              <Star size={12} fill="currentColor" />
              แนะนำ
            </span>
          ) : (
            isPromoted && (
              <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-md">
                <Megaphone size={12} />
                โปรโมท
              </span>
            )
          )}
          <Image
            src={displayImage}
            alt={title}
            fill
            unoptimized={isPlaceholder}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={65}
            className={`object-cover transition-transform duration-700 ease-in-out ${isFull ? "grayscale-[40%]" : ""}`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
          <div className="absolute right-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="bg-surface rounded-full p-2 text-blue-600 shadow-lg">
              <Search size={18} />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            {distance ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-500/10 ring-inset">
                <MapPin size={12} />
                {distance}
              </span>
            ) : (
              <span />
            )}
            {isAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-600 ring-1 ring-emerald-500/20">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                มีห้องว่าง
              </span>
            )}
            {isFull && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-rose-500 ring-1 ring-rose-400/20">
                <XCircle size={12} strokeWidth={2.5} />
                เต็มแล้ว
              </span>
            )}
            {isNotSpecified && (
              <span className="bg-background text-muted ring-border inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1">
                <HelpCircle size={12} strokeWidth={2.5} />
                ไม่ระบุ
              </span>
            )}
          </div>
          <h3
            className="text-foreground mb-1 line-clamp-1 text-lg font-bold transition-colors group-hover:text-blue-600"
            title={title}
          >
            {title}
          </h3>
          <div className="text-muted mb-4 flex items-center text-sm">
            <MapPin size={16} className="text-muted mr-1 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="border-border mt-auto border-t pt-3">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-muted text-[10px] tracking-wider uppercase">
                  ราคาเริ่มต้น
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold ${isFull ? "text-muted" : "text-[#1d6ef2]"}`}
                  >
                    ฿{price.toLocaleString()}
                  </span>
                  <span className="text-muted text-sm font-medium">/เดือน</span>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${isFull ? "bg-background text-muted cursor-not-allowed" : "bg-background text-muted group-hover:bg-blue-600 group-hover:text-white"}`}
              >
                {isFull ? "ห้องเต็ม" : "ดูรายละเอียด"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
