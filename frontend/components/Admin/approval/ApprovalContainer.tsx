"use client";
import React, { useEffect, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { OwnerApproval } from "@/features/admin/types";
import ApprovalDetailModal from "./ApprovalDetailModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ConfirmDialogType } from "@/components/ui/ConfirmDialog";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Phone,
  Globe,
} from "lucide-react";

import { toast } from "react-toastify";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function ApprovalContainer() {
  const [data, setData] = useState<OwnerApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<OwnerApproval | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: ConfirmDialogType;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    description: "",
    action: async () => {},
  });

  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await AdminService.getPendingList(page, 10, debouncedSearch);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openApproveConfirm = (item: OwnerApproval) => {
    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "ยืนยันการอนุมัติ",
      description: `คุณต้องการอนุมัติผู้ใช้งาน "${item.fullName}" ใช่หรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบและจัดการหอพักได้ทันที`,

      action: async () => {
        await AdminService.approveOwner(item.id);
        toast.success("อนุมัติผู้ใช้งานเรียบร้อยแล้ว");
        setSelectedItem(null);
        fetchData();
      },
    });
  };

  const openRejectConfirm = (item: OwnerApproval) => {
    setConfirmDialog({
      isOpen: true,
      type: "error",
      title: "ยืนยันการไม่อนุมัติ",
      description: `คุณต้องการปฏิเสธคำขอของ "${item.fullName}" ใช่หรือไม่? บัญชีนี้จะถูกระงับการใช้งาน`,

      action: async () => {
        await AdminService.rejectOwner(item.id);
        toast.success("ปฏิเสธคำขอเรียบร้อยแล้ว");
        setSelectedItem(null);
        fetchData();
      },
    });
  };

  const handleConfirmAction = async () => {
    setIsConfirmLoading(true);

    try {
      await confirmDialog.action();

      setConfirmDialog((prev) => ({
        ...prev,
        isOpen: false,
      }));
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
              <UserCheck size={20} />
            </div>
            อนุมัติผู้ประกอบการ
          </h2>
          <p className="mt-1 pl-[3.25rem] text-sm text-gray-500">
            จัดการคำขอสมัครสมาชิกและตรวจสอบข้อมูลหอพัก
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-50 p-4">
              <UserCheck className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              ไม่พบรายการที่รออนุมัติ
            </h3>
            <p className="text-gray-500">
              ไม่มีคำขอใหม่ในขณะนี้ หรือลองปรับคำค้นหา
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50 text-xs tracking-wider text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      ผู้สมัคร (Owner)
                    </th>
                    <th className="px-6 py-4 font-semibold">ช่องทางติดต่อ</th>
                    <th className="px-6 py-4 font-semibold">วันที่สมัคร</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      หอพัก (Draft)
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {item.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.phone ? (
                            <p className="flex items-center gap-1.5 text-gray-600">
                              <Phone size={12} /> {item.phone}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {item.lineId && (
                            <p className="flex items-center gap-1.5 text-xs text-green-600">
                              <Globe size={12} />
                              Line: {item.lineId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {format(new Date(item.createdAt), "d MMM yy HH:mm", {
                          locale: th,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.dormitories.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                            {item.dormitories.length}หอพัก
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-blue-600"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <div className="mx-1 h-4 w-px bg-gray-200"></div>
                          <button
                            onClick={() => openRejectConfirm(item)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                            title="ไม่อนุมัติ"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={() => openApproveConfirm(item)}
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                            title="อนุมัติ"
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-500">
                แสดง{" "}
                <span className="font-medium text-gray-900">
                  {(page - 1) * 10 + 1}
                </span>{" "}
                ถึง{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(page * 10, totalItems)}
                </span>{" "}
                จาก{" "}
                <span className="font-medium text-gray-900">{totalItems}</span>{" "}
                รายการ
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ApprovalDetailModal
        data={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onApprove={() => selectedItem && openApproveConfirm(selectedItem)}
        onReject={() => selectedItem && openRejectConfirm(selectedItem)}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={handleConfirmAction}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
