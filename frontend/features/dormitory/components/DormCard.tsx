import React from "react";
import { MapPin, Bed, Bath, Search } from "lucide-react";

interface DormProps {
  image: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  tag?: string;
}

export default function DormCard({
  image,
  title,
  location,
  price,
  beds,
  baths,
  tag,
}: DormProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      {/* ส่วนรูปภาพและ Tag */}
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="eager"
        />
        {tag && (
          <span className="absolute top-3 right-3 rounded-lg bg-white/90 px-3 py-1 text-xs font-bold text-gray-800 shadow-sm backdrop-blur-md">
            {tag}
          </span>
        )}
      </div>

      {/* รายละเอียด */}
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-1 text-lg font-bold text-gray-900">
          {title}
        </h3>

        <div className="flex items-center text-sm text-gray-400">
          <MapPin size={16} className="mr-1 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xl font-bold text-[#1d6ef2]">
            ฿{price.toLocaleString()}
            <span className="text-sm font-normal text-gray-400">/เดือน</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Bed size={16} /> {beds}
            </div>
            <div className="flex items-center gap-1">
              <Bath size={16} /> {baths}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
