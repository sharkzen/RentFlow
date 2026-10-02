"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import {
  AdminUser,
  AdminUserDetail,
  PaginatedResponse,
} from "@/features/admin";
import { toast } from "react-toastify";
import UserTable from "./UserTable";
import UserFilter from "./UserFilter";
import UserDetailModal from "./UserDetailModal";
import Pagination from "../Pagination";
import { Users } from "lucide-react";

const PAGE_SIZE = 15;

export default function UserController() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<any>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AdminService.getUsers(
        page,
        PAGE_SIZE,
        debouncedSearch,
        role,
        status,
      );

      if (!isMountedRef.current) return;

      if (res.meta.totalPages > 0 && page > res.meta.totalPages) {
        setPage(res.meta.totalPages);
        return;
      }

      setData(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Failed to fetch users", error);

      if (isMountedRef.current) toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, role, status]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const reloadDetail = async (userId: string) => {
    const fullDetail = await AdminService.getUserDetail(userId);
    setSelectedUser(fullDetail);
  };

  const handleViewDetail = async (user: AdminUser) => {
    try {
      await reloadDetail(user.id);
      setIsModalOpen(true);
    } catch {
      toast.error("โหลดข้อมูลรายละเอียดไม่สำเร็จ");
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await AdminService.updateUserStatus(userId, newStatus);
      toast.success(`เปลี่ยนสถานะเป็น ${newStatus} เรียบร้อยแล้ว`);
      await Promise.all([reloadDetail(userId), fetchData()]);
    } catch {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      setActionLoading(true);
      await AdminService.unlockUser(userId);
      toast.success("ปลดล็อคบัญชีเรียบร้อยแล้ว");
      await Promise.all([reloadDetail(userId), fetchData()]);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-foreground text-2xl font-bold">
              จัดการผู้ใช้งาน
            </h1>
          </div>
          <p className="text-muted mt-1 text-sm">
            ดูข้อมูล ค้นหา เปลี่ยนรหัสผ่าน และจัดการบัญชีของลูกบ้านและเจ้าของหอพักทั้งหมดในระบบ
          </p>
        </div>
      </div>
      <div className="border-border bg-surface rounded-xl border p-4">
        <UserFilter
          search={search}
          onSearchChange={setSearch}
          role={role}
          onRoleChange={(val) => {
            setRole(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        />
      </div>
      <UserTable
        data={data}
        isLoading={loading}
        onViewDetail={handleViewDetail}
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
      {isModalOpen && (
        <UserDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onStatusUpdate={handleStatusUpdate}
          onUnlock={handleUnlock}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
