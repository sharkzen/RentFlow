"use client";
import React, { useEffect, useState, useCallback } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import DormitoryDetailModal from "./DormitoryDetailModal";
import ConfirmDialog, { ConfirmDialogType } from "@/lib/ui/ConfirmDialog";

import {
  Search,
  Building2,
  MapPin,
  Eye,
  Power,
  Filter,
  RefreshCw,
  Globe,
  Ban,
  CheckCircle,
} from "lucide-react";

import { toast } from "react-toastify";
import { Dormitory } from "@/features/admin";
import { CustomSelect } from "@/lib/ui/CustomSelect";

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "ทุกสถานะ (Status)",
  },
  {
    value: "ACTIVE",
    label: "Active (ใช้งานปกติ)",
  },
  {
    value: "PENDING",
    label: "Pending (รออนุมัติ)",
  },
  {
    value: "BANNED",
    label: "Banned (ถูกระงับ)",
  },
];

const PUBLISHED_OPTIONS = [
  {
    value: "all",
    label: "การเผยแพร่ (All)",
  },
  {
    value: "true",
    label: "Published (แสดงผล)",
  },
  {
    value: "false",
    label: "Unpublished (ซ่อน)",
  },
];

export default function DormitoryContainer() {
  const [data, setData] = useState<Dormitory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
      const res = await AdminService.getList(
        page,
        10,
        debouncedSearch,
        statusFilter,
        publishedFilter,
      );
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลหอพักได้");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, publishedFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = async (id: string) => {
    try {
      const detail = await AdminService.getDetail(id);
      setSelectedDorm(detail);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error("โหลดรายละเอียดไม่สำเร็จ");
    }
  };

  const handleTogglePublish = (dorm: Dormitory) => {
    setConfirmDialog({
      isOpen: true,
      type: dorm.isPublished ? "warning" : "success",
      title: dorm.isPublished ? "ปิดการเผยแพร่?" : "เผยแพร่หอพัก?",
      description: dorm.isPublished
        ? `หอพัก "${dorm.name}" จะถูกซ่อนจากหน้าค้นหา ผู้เช่าจะไม่เห็นหอพักนี้`
        : `หอพัก "${dorm.name}" จะแสดงบนหน้าเว็บและแอปพลิเคชันทันที`,

      action: async () => {
        await AdminService.togglePublish(dorm.id, !dorm.isPublished);
        toast.success(
          dorm.isPublished ? "ปิดการเผยแพร่แล้ว" : "เผยแพร่เรียบร้อยแล้ว",
        );
        fetchData();
      },
    });
  };

  const handleBan = (dorm: Dormitory) => {
    const isBanned = dorm.status === "BANNED";

    setConfirmDialog({
      isOpen: true,
      type: isBanned ? "success" : "error",
      title: isBanned ? "ปลดแบนหอพัก?" : "ระงับการใช้งาน (Ban)?",
      description: isBanned
        ? `คืนสถานะ ACTIVE ให้หอพัก "${dorm.name}"`
        : `หอพัก "${dorm.name}" จะถูกระงับ เจ้าของจะไม่สามารถจัดการได้`,

      action: async () => {
        await AdminService.updateStatus(
          dorm.id,
          isBanned ? "ACTIVE" : "BANNED",
        );
        toast.success(isBanned ? "ปลดแบนเรียบร้อย" : "ระงับการใช้งานเรียบร้อย");
        fetchData();
      },
    });
  };

  const executeConfirm = async () => {
    setIsConfirmLoading(true);

    try {
      await confirmDialog.action();

      setConfirmDialog((prev) => ({
        ...prev,
        isOpen: false,
      }));
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700";
      case "PENDING":
        return "bg-orange-100 text-orange-700";
      case "BANNED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-background text-muted";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-3 text-2xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={20} />
            </div>
            จัดการข้อมูลหอพัก
          </h2>
          <p className="text-muted mt-1 pl-13 text-sm">
            ตรวจสอบสถานะ เปิด/ปิด การเผยแพร่ และจัดการหอพักทั้งหมดในระบบ
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-icon border-border bg-surface text-muted hover:bg-background flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          รีเฟรช
        </button>
      </div>
      <div className="border-border bg-surface grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="text-muted absolute top-2.5 left-3" size={18} />
          <input
            type="text"
            placeholder="ค้นหาชื่อหอพัก, ที่อยู่, หรือชื่อเจ้าของ..."
            className="border-border w-full rounded-lg border py-2 pr-4 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <CustomSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>
        <div>
          <CustomSelect
            options={PUBLISHED_OPTIONS}
            value={publishedFilter}
            onChange={(val) => {
              setPublishedFilter(val);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-background text-muted border-b font-medium">
              <tr>
                <th className="px-6 py-4">หอพัก</th>
                <th className="px-6 py-4">เจ้าของ</th>
                <th className="px-6 py-4 text-center">ห้องพัก</th>
                <th className="px-6 py-4 text-center">การเผยแพร่</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-muted p-8 text-center">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted p-8 text-center">
                    ไม่พบหอพักที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleView(item.id)}
                    className="group hover:bg-background cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="border-border bg-background h-12 w-16 shrink-0 overflow-hidden rounded-lg border">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={
                                item.images[0].objectKey.startsWith("http")
                                  ? item.images[0].objectKey
                                  : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${item.images[0].objectKey}`
                              }
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="text-muted flex h-full items-center justify-center">
                              <Building2 size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-foreground line-clamp-1 font-semibold">
                            {item.name}
                          </p>
                          <p className="text-muted line-clamp-1 flex items-center gap-1 text-xs">
                            <MapPin size={10} /> {item.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-foreground font-medium">
                          {item.owner.fullName}
                        </p>
                        <p className="text-muted text-xs">
                          {item.owner.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="text-muted px-6 py-4 text-center">
                      {item._count.rooms}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(item);
                        }}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold underline transition-colors ${item.isPublished ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-background text-muted hover:bg-skeleton"}`}
                      >
                        <Globe size={12} />{" "}
                        {item.isPublished ? "Published" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(item.id);
                          }}
                          className="text-muted cursor-pointer rounded-lg p-2 transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBan(item);
                          }}
                          className={`cursor-pointer rounded-lg p-2 transition-all ${item.status === "BANNED" ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}
                          title={
                            item.status === "BANNED"
                              ? "ปลดแบน"
                              : "ระงับการใช้งาน"
                          }
                        >
                          {item.status === "BANNED" ? (
                            <CheckCircle size={18} />
                          ) : (
                            <Ban size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-border bg-background flex items-center justify-between border-t px-6 py-4">
          <p className="text-muted text-sm">
            แสดง {data.length > 0 ? (page - 1) * 10 + 1 : 0}ถึง{" "}
            {Math.min(page * 10, totalItems)}จาก {totalItems}รายการ
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-border bg-surface hover:bg-background rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-border bg-surface hover:bg-background rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
      <DormitoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedDorm}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={executeConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
