"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { LockedUser, PaginatedResponse } from "@/features/admin";
import { toast } from "react-toastify";
import LockedUsersTable from "./LockedUsersTable";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

export default function LockedUsersController() {
  const [data, setData] = useState<LockedUser[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<any>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [selectedUser, setSelectedUser] = useState<LockedUser | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AdminService.getLockedUsers(page, 10);

      if (isMountedRef.current) {
        setData(res.data);
        setMeta(res.meta);
      }
    } catch (error) {
      console.error("Failed to fetch locked users", error);

      if (isMountedRef.current)
        toast.error("ไม่สามารถดึงข้อมูลบัญชีที่ถูกล็อคได้");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [page]);

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
    } catch (error) {
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
          </p>
        </div>
      </div>
      <LockedUsersTable
        data={visibleData}
        isLoading={loading}
        now={now}
        onUnlock={handleUnlockClick}
      />
      {meta && meta.totalPages > 1 && (
        <div className="border-border bg-surface flex items-center justify-between rounded-lg border-t px-4 py-3 shadow-sm sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-border bg-surface text-foreground hover:bg-background relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="border-border bg-surface text-foreground hover:bg-background relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-foreground text-sm">
                แสดง <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
                ถึง{" "}
                <span className="font-medium">
                  {Math.min(page * 10, meta.total)}
                </span>{" "}
                จากทั้งหมด <span className="font-medium">{meta.total}</span>{" "}
                รายการ
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-muted ring-border hover:bg-background relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="text-foreground ring-border relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset focus:outline-offset-0">
                  {page}/ {meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                  className="text-muted ring-border hover:bg-background relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
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
