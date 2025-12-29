"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Search, CheckCircle2 } from "lucide-react";

interface DormProps {
  slug: string;
  image?: string;
  title: string;
  location: string;
  distance?: string;
  price: number;
}

export default function DormCard({
  slug,
  image,
  title,
  location,
  distance,
  price,
}: DormProps) {
  const displayImage =
    image || "https://placehold.co/800x600/f3f4f6/9ca3af?text=No+Image";

  return (
    <Link href={`/dorms/${slug}`} className="group block h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 will-change-transform backface-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/50">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-200">
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          <div className="absolute right-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-full bg-white p-2 text-blue-600 shadow-lg">
              <Search size={18} />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {distance && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-500/10 ring-inset">
                <MapPin size={12} />
                ห่างจากจุดหมาย {distance}
              </span>
            </div>
          )}

          <h3
            className="mb-1 line-clamp-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600"
            title={title}
          >
            {title}
          </h3>

          <div className="mb-4 flex items-center text-sm text-gray-500">
            <MapPin size={16} className="mr-1 shrink-0 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <div className="mt-auto border-t border-gray-50 pt-3">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] tracking-wider text-gray-400 uppercase">
                  ราคาเริ่มต้น
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#1d6ef2]">
                    ฿{price.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-gray-400">
                    /เดือน
                  </span>
                </div>
              </div>

              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                ดูรายละเอียด
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
