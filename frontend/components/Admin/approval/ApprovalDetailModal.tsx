"use client";
import React from "react";
import { OwnerApproval } from "@/features/admin";

import {
  X,
  Check,
  Ban,
  MapPin,
  Building,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  ExternalLink,
} from "lucide-react";

import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Props {
  data: OwnerApproval | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalDetailModal({
  data,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: Props) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              ตรวจสอบข้อมูลผู้สมัคร
            </h3>
            <p className="text-sm text-gray-500">ID: {data.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600 shadow-inner">
                  {data.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {data.fullName}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                    {data.status}
                  </span>
                  <p className="mt-1 text-sm text-gray-500">
                    สมัครเมื่อ:{" "}
                    {format(new Date(data.createdAt), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-5">
                <h5 className="flex items-center gap-2 font-semibold text-gray-900">
                  <User size={18} />
                  ข้อมูลการติดต่อ
                </h5>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Mail size={14} />
                      อีเมล
                    </span>
                    <span className="font-medium text-gray-800">
                      {data.user.email}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Phone size={14} />
                      เบอร์โทร
                    </span>
                    <span className="font-medium text-gray-800">
                      {data.phone || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Globe size={14} />
                      Line ID
                    </span>
                    <span className="font-medium text-green-600">
                      {data.lineId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Globe size={14} />
                      Facebook
                    </span>
                    <span className="font-medium text-blue-600">
                      {data.facebook || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Building className="text-blue-600" />
                ข้อมูลหอพักที่เกี่ยวข้อง
              </h5>
              {data.dormitories.length > 0 ? (
                <div className="space-y-4">
                  {data.dormitories.map((dorm) => (
                    <div
                      key={dorm.id}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h6 className="text-lg font-bold text-gray-800">
                            {dorm.name}
                          </h6>
                        </div>
                        <p className="mb-3 flex items-start gap-1 text-sm text-gray-500">
                          <MapPin size={16} className="mt-0.5 shrink-0" />{" "}
                          {dorm.address}
                        </p>
                        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <div className="text-xs text-gray-500">
                            <span className="block font-semibold">
                              Coordinates:
                            </span>
                            {dorm.latitude.toFixed(6)},{" "}
                            {dorm.longitude.toFixed(6)}
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${dorm.latitude},${dorm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                          >
                            <ExternalLink size={14} />
                            เปิดแผนที่ Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                  <Building className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-500">
                    ยังไม่มีข้อมูลหอพักในระบบ
                  </p>
                  <p className="text-xs text-gray-400">
                    ผู้ใช้นี้อาจสมัครสมาชิกแต่ยังไม่สร้างหอพัก
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 p-6">
          <button
            onClick={onReject}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50"
          >
            <Ban size={18} />
            ไม่อนุมัติ / ระงับ
          </button>
          <button
            onClick={onApprove}
            className="flex transform items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
          >
            <Check size={18} />
            อนุมัติการใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
}
