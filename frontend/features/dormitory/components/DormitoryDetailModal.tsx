"use client";
import React, { useState } from "react";
import { Dormitory } from "@/features/admin";

import {
  X,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Clock,
} from "lucide-react";

import { format } from "date-fns";
import { th } from "date-fns/locale";

interface DormitoryWithUrl extends Dormitory {
  images: {
    id: string;
    objectKey: string;
    isCover: boolean;
    url?: string | null;
  }[];
}

interface Props {
  data: DormitoryWithUrl | null;
  isOpen: boolean;
  onClose: () => void;
}

const DormMap = ({
  latitude,
  longitude,
  mapUrl,
  address,
}: {
  latitude: number;
  longitude: number;
  mapUrl: string;
  address: string;
}) => {
  const hasValidLatLng =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !(latitude === 0 && longitude === 0);

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <MapPin className="text-red-500" size={20} />
          แผนที่และการเดินทาง
        </h3>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            เปิดใน Google Maps <ExternalLink size={14} />
          </a>
        )}
      </div>
      {address && (
        <p className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">ที่อยู่:</span>{" "}
          {address}
        </p>
      )}
      <div className="relative h-80 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {hasValidLatLng ? (
          <iframe
            width="100%"
            height="100%"
            style={{
              border: 0,
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=th&z=15&output=embed`}
            className="h-full w-full"
          ></iframe>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-400">
            <MapPin size={40} />
            <p className="text-sm">ไม่พบพิกัดแผนที่</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DormitoryDetailModal({ data, isOpen, onClose }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !data) return null;

  const validImages = data.images?.filter((img) => img.url) || [];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />
      <div className="animate-in fade-in zoom-in-95 relative flex h-screen w-full max-w-6xl flex-col overflow-hidden bg-white shadow-xl duration-200 sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="line-clamp-1 text-xl font-bold text-gray-900">
              {data.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${data.isPublished ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-gray-50 text-gray-600 ring-gray-500/10"}`}
              >
                {data.isPublished ? "เผยแพร่แล้ว" : "ซ่อนอยู่"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {format(new Date(data.createdAt), "d MMM yyyy", {
                  locale: th,
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                  <Building2 className="text-blue-600" size={20} />
                  รูปภาพหอพัก
                </div>
                {validImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="group relative aspect-video w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
                      <img
                        src={validImages[currentImageIndex].url!}
                        alt={`View ${currentImageIndex}`}
                        className="h-full w-full object-contain"
                      />
                      {validImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                      {validImages[currentImageIndex].isCover && (
                        <span className="absolute top-3 left-3 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                          รูปปก
                        </span>
                      )}
                      <span className="absolute right-3 bottom-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                        {currentImageIndex + 1}/ {validImages.length}
                      </span>
                    </div>
                    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                      {validImages.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all ${currentImageIndex === idx ? "border-blue-600 opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
                        >
                          <img
                            src={img.url!}
                            alt="thumb"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
                    <Building2 size={32} className="mb-2 opacity-50" />
                    <span>ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>
              <DormMap
                latitude={data.latitude}
                longitude={data.longitude}
                mapUrl={data.mapUrl}
                address={data.address}
              />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 border-b border-gray-100 pb-2 text-base font-bold text-gray-900">
                  สถานะทางระบบ
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">สถานะหอพัก</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${data.status === "ACTIVE" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 ring-inset" : data.status === "BANNED" ? "bg-red-50 text-red-700 ring-1 ring-red-600/10 ring-inset" : "bg-orange-50 text-orange-700 ring-1 ring-orange-600/10 ring-inset"}`}
                    >
                      {data.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">จำนวนห้องพัก</span>
                    <span className="font-medium text-gray-900">
                      {data._count?.rooms || 0}ห้อง
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">การมองเห็น</span>
                    <div className="flex items-center gap-1 font-medium text-gray-700">
                      <Globe size={14} className="text-gray-400" />
                      {data.isPublished ? "สาธารณะ" : "ส่วนตัว"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                  <User size={18} className="text-blue-600" />
                  ข้อมูลเจ้าของ
                </h3>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                    {data.owner.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-500">ชื่อผู้ติดต่อ</p>
                    <p className="truncate font-semibold text-gray-900">
                      {data.owner.fullName}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <Mail size={14} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-gray-400">อีเมล</p>
                      <p className="truncate font-medium text-gray-900">
                        {data.owner.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">เบอร์โทรศัพท์</p>
                      <p className="font-medium text-gray-900">
                        {data.owner.phone || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
