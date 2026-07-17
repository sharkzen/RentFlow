"use client";
import React, { useEffect, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { OwnerUser, PaginatedResponse } from "@/features/admin";
import { toast } from "react-toastify";
import UserTable from "./UserTable";
import UserFilter from "./UserFilter";
import UserDetailModal from "./UserDetailModal";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";

export default function UserController() {
  const [data, setData] = useState<OwnerUser[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<any>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<OwnerUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AdminService.getOwners(
        page,
        10,
        debouncedSearch,
        status,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = async (user: OwnerUser) => {
    try {
      const fullDetail = await AdminService.getOwnerDetail(user.id);
      setSelectedUser(fullDetail);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("โหลดข้อมูลรายละเอียดไม่สำเร็จ");
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await AdminService.updateUserStatus(userId, newStatus);
      toast.success(`เปลี่ยนสถานะเป็น ${newStatus} เรียบร้อยแล้ว`);
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
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
            <h1 className="text-2xl font-bold text-gray-900">
              จัดการผู้ประกอบการ (Owners)
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            ตรวจสอบสถานะ อนุมัติ และจัดการบัญชีผู้ประกอบการหอพักทั้งหมดในระบบ
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <UserFilter
          search={search}
          onSearchChange={setSearch}
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
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border-t border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
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
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset focus:outline-offset-0">
                  {page}/ {meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <UserDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          onStatusUpdate={handleStatusUpdate}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
