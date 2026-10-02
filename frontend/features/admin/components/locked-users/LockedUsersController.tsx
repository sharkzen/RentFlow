"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { LockedUser, PaginatedResponse } from "@/features/admin";
import { toast } from "react-toastify";
import LockedUsersTable from "./LockedUsersTable";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import Pagination from "../Pagination";
import { CustomSelect } from "@/lib/ui/CustomSelect";
import { ShieldAlert, Search, Users } from "lucide-react";

const PAGE_SIZE = 15;

const ROLE_OPTIONS = [
  { value: "ALL", label: "ทุกบทบาท" },
  { value: "TENANT", label: "ลูกบ้าน (Tenant)" },
  { value: "OWNER", label: "เจ้าของหอ (Owner)" },
  { value: "ADMIN", label: "แอดมิน (Admin)" },
];

export default function LockedUsersController() {
  const [data, setData] = useState<LockedUser[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<any>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [now, setNow] = useState(() => Date.now());
  const [selectedUser, setSelectedUser] = useState<LockedUser | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);

      const res = await AdminService.getLockedUsers(
        page,
        PAGE_SIZE,
        debouncedSearch,
        role,
      );

      if (!isMountedRef.current) return;

      if (res.meta.totalPages > 0 && page > res.meta.totalPages) {
        setPage(res.meta.totalPages);
        return;
      }

      setData(res.data);
      setMeta(res.meta);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch locked users", error);

      if (isMountedRef.current)
        toast.error("ไม่สามารถดึงข้อมูลบัญชีที่ถูกล็อคได้");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, role]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    const tickInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickInterval);
  }, []);

  useEffect(() => {
    const refetchInterval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(refetchInterval);
  }, [fetchData]);

  const visibleData = data.filter(
    (user) => new Date(user.lockedUntil).getTime() > now,
  );

  const handleUnlockClick = (user: LockedUser) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await AdminService.unlockUser(selectedUser.id);
      toast.success(`ปลดล็อคบัญชี ${selectedUser.email} เรียบร้อยแล้ว`);
      setIsConfirmOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch {
      toast.error("ไม่สามารถปลดล็อคบัญชีได้");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-primary-600 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-foreground text-2xl font-bold">
              บัญชีที่ถูกล็อค
            </h1>
          </div>
          <p className="text-muted mt-1 text-sm">
            รายชื่อบัญชีที่ถูกล็อคชั่วคราวจากการเข้าสู่ระบบผิดหลายครั้ง
            สามารถปลดล็อคก่อนเวลาได้จากหน้านี้
            {meta && meta.total > 0 && (
              <span className="font-medium text-rose-600">
                {" "}
                (ทั้งหมด {meta.total} บัญชี)
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="border-border bg-surface rounded-xl border p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="text-muted h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-foreground ring-border placeholder:text-muted block w-full rounded-lg border-0 py-2.5 pr-3 pl-10 ring-1 transition-shadow ring-inset focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:text-sm sm:leading-6"
            />
          </div>
          <div className="w-full md:w-52">
            <CustomSelect
              options={ROLE_OPTIONS}
              value={role}
              onChange={(val) => {
                setRole(val);
                setPage(1);
              }}
              icon={<Users size={16} />}
            />
          </div>
        </div>
      </div>
      <LockedUsersTable
        data={visibleData}
        isLoading={loading}
        now={now}
        onUnlock={handleUnlockClick}
      />
      {meta && (
        <Pagination
          page={page}
          limit={PAGE_SIZE}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmUnlock}
        title="ยืนยันการปลดล็อคบัญชี"
        description={
          selectedUser
            ? `ต้องการปลดล็อคบัญชี ${selectedUser.email} ก่อนเวลาใช่หรือไม่?`
            : undefined
        }
        type="warning"
        confirmText="ปลดล็อค"
        isLoading={actionLoading}
      />
    </div>
  );
}
