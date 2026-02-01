"use client";
import React, { useState, useRef, RefObject } from "react";
import { OwnerUser } from "@/features/admin";
import { createPortal } from "react-dom";

import {
  Building2,
  User,
  Phone,
  Mail,
  X,
  Clock,
  Hash,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from "lucide-react";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useOnClickOutside } from "usehooks-ts";
import Link from "next/link";
import { useScrollLock } from "usehooks-ts";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: OwnerUser | null;
  onStatusUpdate: (id: string, newStatus: string) => void;
  isLoading: boolean;
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  onStatusUpdate,
  isLoading,
}: UserDetailModalProps) {
  useScrollLock();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef as RefObject<HTMLDivElement>, () => {
    if (confirmOpen) return;

    onClose();
  });

  if (!isOpen || !user) return null;

  const isBanned = user.status === "BANNED";

  const handleActionClick = (newStatus: string) => {
    setPendingStatus(newStatus);
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (pendingStatus) {
      onStatusUpdate(user.id, pendingStatus);
      setConfirmOpen(false);
    }
  };

  const renderBadge = (status: string) => {
    let styles = "bg-gray-100 text-gray-600 border-gray-200";
    let icon = null;

    if (status === "ACTIVE" || status === "APPROVED") {
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
    } else if (status === "BANNED" || status === "SUSPENDED") {
      styles = "bg-rose-50 text-rose-700 border-rose-200";
      icon = <Ban className="mr-1 h-3 w-3" />;
    } else if (status === "PENDING") {
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      icon = <Clock className="mr-1 h-3 w-3" />;
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div
          ref={modalRef}
          className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200"
        >
          <div className="flex items-start justify-between p-6 pb-6">
            <div className="flex gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-50/50">
                <span className="text-2xl font-bold text-blue-600">
                  {(
                    user.ownerProfile?.fullName?.[0] || user.email[0]
                  ).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.ownerProfile?.fullName || "รอการระบุชื่อ"}
                </h2>
                <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </p>
                  <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block"></span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Hash className="h-3 w-3" />
                    ID: {user.id}
                  </div>
                </div>
                <div className="mt-3">{renderBadge(user.status)}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <User className="h-4 w-4 text-blue-500" />
                    ข้อมูลส่วนตัว
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-500">
                        เบอร์โทรศัพท์
                      </span>
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {user.ownerProfile?.phone || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-500">วันที่สมัคร</span>
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {format(new Date(user.createdAt), "d MMM yyyy HH:mm", {
                          locale: th,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />{" "}
                    จัดการบัญชี
                  </h3>
                  <div className="space-y-3">
                    {isBanned ? (
                      <button
                        onClick={() => handleActionClick("ACTIVE")}
                        disabled={isLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        ปลดแบน (Activate)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActionClick("BANNED")}
                        disabled={isLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        ระงับการใช้งาน (Ban)
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-full rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      หอพักที่ดูแล
                      <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                        {user.ownerProfile?.dormitories?.length || 0}
                      </span>
                    </h3>
                  </div>
                  <div className="scrollbar-thin scrollbar-thumb-gray-200 max-h-125 overflow-y-auto p-4">
                    {user.ownerProfile?.dormitories &&
                    user.ownerProfile.dormitories.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {user.ownerProfile.dormitories.map((dorm) => (
                          <Link
                            key={dorm.id}
                            href={`/dorms/${dorm.slug}`}
                            target="_blank"
                          >
                            <div className="group relative flex cursor-pointer flex-col justify-between rounded-lg border border-gray-100 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md">
                              <div>
                                <div className="mb-3 flex items-start justify-between">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                                    <Building2 className="h-5 w-5" />
                                  </div>
                                  {renderBadge(dorm.status)}
                                </div>
                                <h4 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                                  {dorm.name}
                                </h4>
                                <p className="mt-1 text-xs text-gray-500">
                                  {dorm.isPublished
                                    ? "เผยแพร่สาธารณะ"
                                    : "ฉบับร่าง (ยังไม่เผยแพร่)"}
                                </p>
                              </div>
                              <div className="mt-4 border-t border-gray-50 pt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />{" "}
                                  {dorm._count.rooms}ห้องพัก
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-3 rounded-full bg-gray-50 p-4">
                          <Building2 className="h-8 w-8 text-gray-300" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">
                          ไม่มีข้อมูลหอพัก
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          ผู้ประกอบการรายนี้ยังไม่ได้สร้างหอพักในระบบ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirmOpen &&
        createPortal(
          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleConfirmAction}
            title={
              pendingStatus === "BANNED"
                ? "ยืนยันการระงับใช้งาน"
                : "ยืนยันการปลดแบน"
            }
            description={
              pendingStatus === "BANNED"
                ? `คุณต้องการระงับการใช้งานบัญชี "${user.ownerProfile?.fullName || user.email}" ใช่หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้`
                : `คุณต้องการคืนสถานะปกติให้บัญชี "${user.ownerProfile?.fullName || user.email}" ใช่หรือไม่?`
            }
            confirmText={
              pendingStatus === "BANNED" ? "ระงับการใช้งาน" : "อนุมัติให้ใช้งาน"
            }
            type={pendingStatus === "BANNED" ? "error" : "success"}
            isLoading={isLoading}
          />,
          document.body,
        )}
    </>
  );
}
