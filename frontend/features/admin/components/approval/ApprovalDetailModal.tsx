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

import { DormMap } from "@/features/dormitory/components/public/dormslug/DormMap";
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
    <div className="fixed inset-0 z-100 flex sm:items-center sm:justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="animate-in fade-in zoom-in-95 bg-surface relative flex w-full flex-col overflow-hidden shadow-2xl duration-200 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
        <div className="border-border bg-background flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-foreground text-xl font-bold">
              ตรวจสอบข้อมูลผู้สมัคร
            </h3>
            <p className="text-muted text-sm">ID: {data.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:bg-border hover:text-foreground cursor-pointer rounded-full p-2"
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
                  <h4 className="text-foreground text-lg font-bold">
                    {data.fullName}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                    {data.status}
                  </span>
                  <p className="text-muted mt-1 text-sm">
                    สมัครเมื่อ:{" "}
                    {format(new Date(data.createdAt), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </p>
                </div>
              </div>
              <div className="border-border bg-background/50 space-y-4 rounded-xl border p-5">
                <h5 className="text-foreground flex items-center gap-2 font-semibold">
                  <User size={18} />
                  ข้อมูลการติดต่อ
                </h5>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="border-border flex justify-between border-b pb-2">
                    <span className="text-muted flex items-center gap-2">
                      <Mail size={14} />
                      อีเมล
                    </span>
                    <span className="text-foreground font-medium">
                      {data.user.email}
                    </span>
                  </div>
                  <div className="border-border flex justify-between border-b pb-2">
                    <span className="text-muted flex items-center gap-2">
                      <Phone size={14} />
                      เบอร์โทร
                    </span>
                    <span className="text-foreground font-medium">
                      {data.phone || "-"}
                    </span>
                  </div>
                  <div className="border-border flex justify-between border-b pb-2">
                    <span className="text-muted flex items-center gap-2">
                      <Globe size={14} />
                      Line ID
                    </span>
                    <span className="font-medium text-green-600">
                      {data.lineId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted flex items-center gap-2">
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
              <h5 className="text-foreground flex items-center gap-2 text-lg font-bold">
                <Building className="text-blue-600" />
                ข้อมูลหอพักที่เกี่ยวข้อง
              </h5>
              {data.dormitories.length > 0 ? (
                <div className="space-y-4">
                  {data.dormitories.map((dorm) => (
                    <div
                      key={dorm.id}
                      className="group border-border bg-surface overflow-hidden rounded-xl border shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h6 className="text-foreground text-lg font-bold">
                            {dorm.name}
                          </h6>
                        </div>

                        <div className="mt-4">
                          <DormMap
                            latitude={dorm.latitude}
                            longitude={dorm.longitude}
                            address={dorm.address}
                            mapUrl={`https://www.google.com/maps/search/?api=1&query=${dorm.latitude},${dorm.longitude}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-border bg-background flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center">
                  <Building className="text-muted mb-2 h-10 w-10" />
                  <p className="text-muted font-medium">
                    ยังไม่มีข้อมูลหอพักในระบบ
                  </p>
                  <p className="text-muted text-xs">
                    ผู้ใช้นี้อาจสมัครสมาชิกแต่ยังไม่สร้างหอพัก
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-border bg-background flex items-center justify-end gap-3 border-t p-6">
          <button
            onClick={onReject}
            className="bg-surface flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50"
          >
            <Ban size={18} />
            ไม่อนุมัติ / ระงับ
          </button>
          <button
            onClick={onApprove}
            className="flex transform cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
          >
            <Check size={18} />
            อนุมัติการใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
}
