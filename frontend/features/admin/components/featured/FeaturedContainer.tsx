"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RefreshCw, Search, Star } from "lucide-react";
import { AdminService } from "@/features/admin/services/admin.service";
import { Dormitory } from "@/features/admin/types";
import ConfirmDialog, { ConfirmDialogType } from "@/lib/ui/ConfirmDialog";
import { FeaturedOrderList } from "./FeaturedOrderList";
import { FeaturedTable } from "./FeaturedTable";

export default function FeaturedContainer() {
  const [featuredItems, setFeaturedItems] = useState<Dormitory[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  const [tableData, setTableData] = useState<Dormitory[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const fetchFeatured = useCallback(async () => {
    setIsFeaturedLoading(true);

    try {
      const res = await AdminService.getFeaturedList();
      setFeaturedItems(res);
    } catch (error) {
      toast.error("ไม่สามารถโหลดรายการหอพักแนะนำได้");
    } finally {
      setIsFeaturedLoading(false);
    }
  }, []);

  const fetchTable = useCallback(async () => {
    setIsTableLoading(true);

    try {
      const res = await AdminService.getList(
        page,
        10,
        debouncedSearch,
        statusFilter,
        "all",
      );
      setTableData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลหอพักได้");
    } finally {
      setIsTableLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const refreshAll = () => {
    fetchFeatured();
    fetchTable();
  };

  const handleToggleFeatured = (dorm: Dormitory) => {
    if (dorm.isFeatured) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "เลิกแนะนำหอพัก?",
        description: `หอพัก "${dorm.name}" จะถูกถอดออกจากรายการแนะนำ`,

        action: async () => {
          await AdminService.toggleFeatured(dorm.id, false);
          toast.success("เลิกแนะนำเรียบร้อยแล้ว");
          refreshAll();
        },
      });

      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "ปักหมุดแนะนำหอพัก?",
      description: `หอพัก "${dorm.name}" จะแสดงเป็นหอพักแนะนำในหน้าค้นหาของผู้เช่า`,

      action: async () => {
        await AdminService.toggleFeatured(dorm.id, true);
        toast.success("ปักหมุดแนะนำเรียบร้อยแล้ว");
        refreshAll();
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

  const handleReorder = async (newOrder: Dormitory[]) => {
    setFeaturedItems(newOrder);

    try {
      await AdminService.reorderFeatured(
        newOrder.map((item, idx) => ({
          id: item.id,
          order: idx,
        })),
      );
    } catch (error) {
      toast.error("ไม่สามารถบันทึกลำดับได้");
      fetchFeatured();
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200">
              <Star size={20} />
            </div>
            หอพักแนะนำ
          </h2>
          <p className="mt-1 pl-13 text-sm text-gray-500">
            ปักหมุดหอพักที่ต้องการแนะนำ และจัดลำดับการแสดงผลในหน้าค้นหา
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="btn-icon flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw
            size={16}
            className={
              isFeaturedLoading || isTableLoading ? "animate-spin" : ""
            }
          />{" "}
          รีเฟรช
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-700">
          ลำดับหอพักแนะนำ ({featuredItems.length})
        </h3>
        {isFeaturedLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <FeaturedOrderList
            items={featuredItems}
            onReorder={handleReorder}
            onRemove={handleToggleFeatured}
          />
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-700">
          หอพักทั้งหมด
        </h3>
        <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
          <div className="relative md:col-span-3">
            <Search
              className="absolute top-2.5 left-3 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อหอพัก, ที่อยู่, หรือชื่อเจ้าของ..."
              className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 outline-none focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">ทุกสถานะ (Status)</option>
              <option value="ACTIVE">Active (ใช้งานปกติ)</option>
              <option value="PENDING">Pending (รออนุมัติ)</option>
              <option value="BANNED">Banned (ถูกระงับ)</option>
            </select>
          </div>
        </div>
        <FeaturedTable
          data={tableData}
          isLoading={isTableLoading}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          onToggleFeatured={handleToggleFeatured}
        />
      </div>

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
