"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { OwnerApproval } from "@/features/admin/types";
import ApprovalDetailModal from "./ApprovalDetailModal";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { ConfirmDialogType } from "@/lib/ui/ConfirmDialog";

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
  const isMountedRef = useRef(true);

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

      if (isMountedRef.current) {
        setData(res.data);
        setTotalPages(res.meta.totalPages);
        setTotalItems(res.meta.total);
      }
    } catch (error) {
      if (isMountedRef.current) toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
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
      description: `คุณต้องการปฏิเสธคำขอของ "${item.fullName}" ใช่หรือไม่? บัญชีนี้จะถูกระงับการใช้งานและต้องสมัครเข้ามาใหม่`,

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
          <h2 className="text-foreground flex items-center gap-3 text-2xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <UserCheck size={20} />
            </div>
            อนุมัติผู้ประกอบการ
          </h2>
          <p className="text-muted mt-1 pl-13 text-sm">
            จัดการคำขอสมัครสมาชิกและตรวจสอบข้อมูลหอพัก
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-muted h-4 w-4" />
          </div>
          <input
            type="text"
            className="border-border bg-surface text-foreground placeholder:text-muted block w-full rounded-xl border py-2.5 pr-3 pl-10 text-sm duration-300 focus:border-blue-600 focus:outline-none"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="border-border bg-surface overflow-hidden rounded-2xl border">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-muted text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="bg-background rounded-full p-4">
              <UserCheck className="text-muted h-8 w-8" />
            </div>
            <h3 className="text-foreground mt-4 text-lg font-medium">
              ไม่พบรายการที่รออนุมัติ
            </h3>
            <p className="text-muted">
              ไม่มีคำขอใหม่ในขณะนี้ หรือลองปรับคำค้นหา
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-border bg-background/50 text-muted border-b text-xs tracking-wider uppercase">
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
                <tbody className="divide-border divide-y">
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-background/80 transition-colors"
                    >
                      <td
                        onClick={() => setSelectedItem(item)}
                        className="cursor-pointer px-6 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {item.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-foreground font-semibold">
                              {item.fullName}
                            </p>
                            <p className="text-muted text-xs">
                              {item.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        onClick={() => setSelectedItem(item)}
                        className="cursor-pointer px-6 py-4"
                      >
                        <div className="space-y-1">
                          {item.phone ? (
                            <p className="text-muted flex items-center gap-1.5">
                              <Phone size={12} /> {item.phone}
                            </p>
                          ) : (
                            <span className="text-muted text-xs">-</span>
                          )}
                          {item.lineId && (
                            <p className="flex items-center gap-1.5 text-xs text-green-600">
                              <Globe size={12} />
                              Line: {item.lineId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td
                        onClick={() => setSelectedItem(item)}
                        className="text-muted cursor-pointer px-6 py-4 whitespace-nowrap"
                      >
                        {format(new Date(item.createdAt), "d MMM yy HH:mm", {
                          locale: th,
                        })}
                      </td>
                      <td
                        onClick={() => setSelectedItem(item)}
                        className="cursor-pointer px-6 py-4 text-center"
                      >
                        {item.dormitories.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                            {item.dormitories.length}หอพัก
                          </span>
                        ) : (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="border-border bg-surface text-muted hover:bg-background cursor-pointer rounded-lg border p-2 shadow-sm transition-colors hover:text-blue-600"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <div className="bg-border mx-1 h-4 w-px"></div>
                          <button
                            onClick={() => openRejectConfirm(item)}
                            className="cursor-pointer rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                            title="ไม่อนุมัติ"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={() => openApproveConfirm(item)}
                            className="cursor-pointer rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
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
            <div className="border-border bg-background flex items-center justify-between border-t px-6 py-4">
              <p className="text-muted text-sm">
                แสดง{" "}
                <span className="text-foreground font-medium">
                  {(page - 1) * 10 + 1}
                </span>{" "}
                ถึง{" "}
                <span className="text-foreground font-medium">
                  {Math.min(page * 10, totalItems)}
                </span>{" "}
                จาก{" "}
                <span className="text-foreground font-medium">
                  {totalItems}
                </span>{" "}
                รายการ
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border bg-surface text-muted hover:bg-background flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border bg-surface text-muted hover:bg-background flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
