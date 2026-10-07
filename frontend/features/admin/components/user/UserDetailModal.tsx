"use client";
import React, { useState, useRef, RefObject } from "react";
import {
  AdminUserDetail,
  getUserDisplayName,
  getUserPhone,
} from "@/features/admin";
import { createPortal } from "react-dom";

import {
  Building2,
  User,
  Phone,
  Mail,
  X,
  Clock,
  ShieldCheck,
  Ban,
  CheckCircle2,
  KeyRound,
  Hash,
  Globe,
  IdCard,
  MapPin,
  BedDouble,
  Lock,
} from "lucide-react";

import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { useOnClickOutside, useScrollLock } from "usehooks-ts";
import { formatThaiDate } from "@/lib/dateFormatter";
import Link from "next/link";
import ChangePasswordModal from "./ChangePasswordModal";
import OwnerSubscriptionPanel from "@/features/billing/components/admin/OwnerSubscriptionPanel";
import { renderRoleBadge } from "./UserTable";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserDetail | null;
  onStatusUpdate: (id: string, newStatus: string) => void;
  onUnlock: (id: string) => void;
  isLoading: boolean;
}

function InfoRow({
  label,
  icon,
  value,
}: {
  label: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="border-border flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted shrink-0 text-xs">{label}</span>
      <span className="text-foreground flex items-center gap-2 text-right text-sm font-medium break-all">
        {icon}
        {value || "-"}
      </span>
    </div>
  );
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  onStatusUpdate,
  onUnlock,
  isLoading,
}: UserDetailModalProps) {
  useScrollLock();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef as RefObject<HTMLDivElement>, () => {
    if (confirmOpen || passwordOpen) return;

    onClose();
  });

  if (!isOpen || !user) return null;

  const isBanned = user.status === "BANNED";
  const isOwner = user.role === "OWNER";
  const name = getUserDisplayName(user);

  const isLocked =
    !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();

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
    let styles = "bg-background text-muted border-border";
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
      <div className="fixed inset-0 z-50 flex bg-black/60 sm:items-center sm:justify-center sm:p-4">
        <div
          ref={modalRef}
          className="bg-surface ring-border relative flex max-h-screen w-full max-w-5xl flex-col overflow-hidden shadow-2xl ring-1 sm:rounded-xl"
        >
          <div className="flex items-start justify-between p-6 pb-6">
            <div className="flex gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-50/50">
                <span className="text-2xl font-bold text-blue-600">
                  {(name[0] || user.email[0]).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-foreground text-xl font-bold">{name}</h2>
                <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <p className="text-muted flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </p>
                  <span className="bg-border hidden h-1 w-1 rounded-full sm:block"></span>
                  <div className="text-muted flex items-center gap-1.5 text-xs">
                    <Hash className="h-3 w-3" />
                    ID: {user.id}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {renderRoleBadge(user.role)}
                  {renderBadge(user.status)}
                  {isLocked && (
                    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                      <Lock className="mr-1 h-3 w-3" />
                      ถูกล็อคชั่วคราว
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-background text-muted hover:bg-border cursor-pointer rounded-full p-2 transition-colors focus:outline-none"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-background/50 flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
                <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
                  <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-blue-500" />
                    ข้อมูลส่วนตัว
                  </h3>
                  <div className="space-y-4">
                    <InfoRow
                      label="เบอร์โทรศัพท์"
                      icon={<Phone className="text-muted h-3.5 w-3.5" />}
                      value={getUserPhone(user) === "-" ? "" : getUserPhone(user)}
                    />
                    {isOwner && (
                      <>
                        <InfoRow
                          label="Line ID"
                          icon={<Globe className="text-muted h-3.5 w-3.5" />}
                          value={user.ownerProfile?.lineId}
                        />
                        <InfoRow
                          label="Facebook"
                          icon={<Globe className="text-muted h-3.5 w-3.5" />}
                          value={user.ownerProfile?.facebook}
                        />
                        <InfoRow
                          label="สถานะเจ้าของหอ"
                          value={
                            user.ownerProfile
                              ? renderBadge(user.ownerProfile.status)
                              : "-"
                          }
                        />
                      </>
                    )}
                    <InfoRow
                      label="วันที่สมัคร"
                      icon={<Clock className="text-muted h-3.5 w-3.5" />}
                      value={formatThaiDate(user.createdAt, "short-datetime")}
                    />
                    <InfoRow
                      label="อัปเดตล่าสุด"
                      icon={<Clock className="text-muted h-3.5 w-3.5" />}
                      value={formatThaiDate(user.updatedAt, "short-datetime")}
                    />
                    <InfoRow
                      label="กรอกรหัสผิดสะสม"
                      value={`${user.failedLoginAttempts} ครั้ง`}
                    />
                  </div>
                </div>
                <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
                  <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />{" "}
                    จัดการบัญชี
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setPasswordOpen(true)}
                      disabled={isLoading}
                      className="border-border text-foreground hover:bg-background flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <KeyRound className="h-4 w-4" />
                      เปลี่ยนรหัสผ่าน
                    </button>
                    {isLocked && (
                      <button
                        onClick={() => onUnlock(user.id)}
                        disabled={isLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Lock className="h-4 w-4" />
                        ปลดล็อคบัญชี
                      </button>
                    )}
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
                        className="bg-surface flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        ระงับการใช้งาน (Ban)
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                {isOwner ? (
                  <div className="flex flex-col gap-6">
                  {user.ownerProfile && (
                    <OwnerSubscriptionPanel ownerId={user.ownerProfile.id} />
                  )}
                  <div className="border-border bg-surface h-full rounded-xl border shadow-sm">
                    <div className="border-border border-b px-6 py-4">
                      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        หอพักที่ดูแล
                        <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                          {user.ownerProfile?.dormitories?.length || 0}
                        </span>
                      </h3>
                    </div>
                    <div className="max-h-125 overflow-y-auto p-4">
                      {user.ownerProfile?.dormitories &&
                      user.ownerProfile.dormitories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {user.ownerProfile.dormitories.map((dorm) => (
                            <Link
                              key={dorm.id}
                              href={`/dorms/${dorm.slug}`}
                              target="_blank"
                            >
                              <div className="group border-border bg-surface relative flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all hover:border-blue-200 hover:shadow-md">
                                <div>
                                  <div className="mb-3 flex items-start justify-between">
                                    <div className="bg-background text-muted flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                                      <Building2 className="h-5 w-5" />
                                    </div>
                                    {renderBadge(dorm.status)}
                                  </div>
                                  <h4 className="text-foreground font-semibold transition-colors group-hover:text-blue-600">
                                    {dorm.name}
                                  </h4>
                                  <p className="text-muted mt-1 text-xs">
                                    {dorm.isPublished
                                      ? "เผยแพร่สาธารณะ"
                                      : "ฉบับร่าง (ยังไม่เผยแพร่)"}
                                  </p>
                                </div>
                                <div className="border-border text-muted mt-4 border-t pt-3 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />{" "}
                                    {dorm._count.rooms} ห้องพัก
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="bg-background mb-3 rounded-full p-4">
                            <Building2 className="text-muted h-8 w-8" />
                          </div>
                          <h4 className="text-foreground text-sm font-medium">
                            ไม่มีข้อมูลหอพัก
                          </h4>
                          <p className="text-muted mt-1 text-xs">
                            ผู้ประกอบการรายนี้ยังไม่ได้สร้างหอพักในระบบ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                ) : (
                  <div className="border-border bg-surface h-full rounded-xl border shadow-sm">
                    <div className="border-border border-b px-6 py-4">
                      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                        <BedDouble className="h-4 w-4 text-blue-500" />
                        ข้อมูลผู้เช่า / ประวัติการเช่า
                        <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                          {user.tenantProfiles.length}
                        </span>
                      </h3>
                    </div>
                    <div className="max-h-125 space-y-4 overflow-y-auto p-4">
                      {user.tenantProfiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="bg-background mb-3 rounded-full p-4">
                            <BedDouble className="text-muted h-8 w-8" />
                          </div>
                          <h4 className="text-foreground text-sm font-medium">
                            ยังไม่มีข้อมูลการเช่า
                          </h4>
                        </div>
                      ) : (
                        user.tenantProfiles.map((t) => (
                          <div
                            key={t.id}
                            className="border-border rounded-lg border p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-foreground font-semibold">
                                  {t.firstName} {t.lastName}
                                </h4>
                                <p className="text-muted mt-0.5 flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  {t.room
                                    ? `${t.room.dormitory.name} • ห้อง ${t.room.roomNumber}`
                                    : "ยังไม่ได้ผูกห้อง"}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  t.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "bg-background text-muted border-border"
                                }`}
                              >
                                {t.isActive ? "พักอยู่" : "ย้ายออกแล้ว"}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                              <div>
                                <span className="text-muted text-xs">
                                  เบอร์โทร
                                </span>
                                <p className="text-foreground">
                                  {t.phone || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  อีเมลติดต่อ
                                </span>
                                <p className="text-foreground break-all">
                                  {t.email || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted flex items-center gap-1 text-xs">
                                  <IdCard className="h-3 w-3" /> เลขบัตรประชาชน
                                </span>
                                <p className="text-foreground">
                                  {t.idCard || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  จำนวนผู้อยู่อาศัย
                                </span>
                                <p className="text-foreground">
                                  {t.numberOfResidents} คน
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-muted text-xs">
                                  ที่อยู่
                                </span>
                                <p className="text-foreground">
                                  {t.address || "-"}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  วันเข้าพัก
                                </span>
                                <p className="text-foreground">
                                  {formatThaiDate(t.moveInDate, "short")}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  วันย้ายออก
                                </span>
                                <p className="text-foreground">
                                  {formatThaiDate(t.moveOutDate, "short")}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  สัญญาเริ่ม
                                </span>
                                <p className="text-foreground">
                                  {formatThaiDate(t.contractStartDate, "short")}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted text-xs">
                                  สัญญาสิ้นสุด
                                </span>
                                <p className="text-foreground">
                                  {formatThaiDate(t.contractEndDate, "short")}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-muted text-xs">
                                  ผู้ติดต่อฉุกเฉิน
                                </span>
                                <p className="text-foreground">
                                  {t.emergencyContactName || "-"}
                                  {t.emergencyContactPhone
                                    ? ` (${t.emergencyContactPhone})`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {passwordOpen && (
        <ChangePasswordModal
          isOpen={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          userId={user.id}
          userLabel={`${name} (${user.email})`}
        />
      )}
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
                ? `คุณต้องการระงับการใช้งานบัญชี "${name}" ใช่หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้`
                : `คุณต้องการคืนสถานะปกติให้บัญชี "${name}" ใช่หรือไม่?`
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
