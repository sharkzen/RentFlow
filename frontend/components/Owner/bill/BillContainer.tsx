"use client";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import BillTable from "./BillTable";
import CreateBillDialog from "./CreateBillDialog";
import BillDetailDialog from "./BillDetailDialog";
import DormSelector from "./DormSelector";
import BillFilters from "./BillFilters";
import { BillService } from "@/features/bill/services/bill.service";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Bill } from "@/features/bill/types";

export default function BillContainer() {
  const [dorms, setDorms] = useState<any[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 10;
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const statusOptions = [
    {
      label: "ทั้งหมด",
      value: "ALL",
      color: "text-gray-600",
    },
    {
      label: "รอชำระ",
      value: "PENDING",
      color: "text-yellow-600",
    },
    {
      label: "รอตรวจสอบ",
      value: "WAITING_FOR_VERIFICATION",
      color: "text-blue-600",
    },
    {
      label: "ชำระแล้ว",
      value: "PAID",
      color: "text-green-600",
    },
    {
      label: "เกินกำหนด",
      value: "OVERDUE",
      color: "text-red-600",
    },
    {
      label: "ยกเลิก",
      value: "CANCELLED",
      color: "text-gray-400",
    },
  ];

  const currentDormName =
    dorms.find((d) => d.id === selectedDorm)?.name || "เลือกหอพัก";

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const res = await DormService.getDorm();
        setDorms(res);

        if (res.length > 0) setSelectedDorm(res[0].id);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDorms();
  }, []);

  useEffect(() => {
    if (!selectedDorm) return;

    fetchBills();
  }, [selectedDorm, statusFilter, selectedMonth, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, selectedMonth, selectedDorm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedDorm) fetchBills();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchBills = async () => {
    setLoading(true);

    try {
      const params: any = {
        search,
        page,
        limit: LIMIT,
      };

      if (statusFilter !== "ALL") params.status = statusFilter;

      if (selectedMonth) {
        const year = selectedMonth.getFullYear();
        const month = String(selectedMonth.getMonth() + 1).padStart(2, "0");
        params.month = `${year}-${month}`;
      }

      const res = await BillService.getBills(selectedDorm, params);
      setBills(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);

      if (selectedBill) {
        const updatedSelectedBill = res.items.find(
          (b: Bill) => b.id === selectedBill.id,
        );

        if (updatedSelectedBill) setSelectedBill(updatedSelectedBill);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (data: any) => {
    if (!selectedDorm) {
      console.error("No dorm selected");
      toast.error("กรุณาเลือกหอพักก่อน");
      return;
    }

    const payload = {
      ...data,
      dormId: selectedDorm,
    };

    return toast
      .promise(BillService.createBills(payload), {
        pending: "กำลังสร้างบิล...",
        success: "สร้างบิลสำเร็จเรียบร้อย",

        error: {
          render({ data }: any) {
            console.log("API Error Data:", data);
            const errorMsg = data?.response?.data?.message;

            if (errorMsg === "DORM_SETTINGS_NOT_FOUND") {
              return "กรุณาตั้งค่า 'ค่าน้ำ/ค่าไฟ' ของหอพักก่อนสร้างบิล";
            }

            if (errorMsg === "Dormitory ID is required") {
              return "ไม่พบข้อมูลหอพัก กรุณาลองใหม่อีกครั้ง";
            }

            return errorMsg || "เกิดข้อผิดพลาดในการสร้างบิล";
          },
        },
      })
      .then((res) => {
        console.log("API Success:", res);
        setIsCreateOpen(false);
        fetchBills();
      })
      .catch((err) => {
        console.error("Create Bill Catch Error:", err);
      });
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await toast
      .promise(BillService.updateStatus(id, status), {
        pending: "กำลังอัปเดตสถานะ...",
        success: "อัปเดตสถานะสำเร็จ ✅",

        error: {
          render({ data }: any) {
            return data?.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ ❌";
          },
        },
      })
      .then(() => {
        fetchBills();
      })
      .catch((err) => {
        console.error("Update Status Error:", err);
      });
  };

  return (
    <div className="relative flex h-[calc(100dvh-2rem)] w-full flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            รายการบิลค่าเช่า
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            จัดการบิล ตรวจสอบยอดชำระ และออกบิลใหม่
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:justify-between sm:gap-3">
          <DormSelector
            dorms={dorms}
            selectedDorm={selectedDorm}
            onSelect={setSelectedDorm}
          />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-95"
          >
            <Plus size={18} />
            <span>สร้างบิล</span>
          </button>
        </div>
      </div>
      <BillFilters
        search={search}
        onSearchChange={setSearch}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
      />
      <div className="flex h-[65vh] w-full flex-col">
        <div className="w-full flex-1 overflow-hidden">
          <BillTable
            bills={bills}
            isLoading={loading}
            onUpdateStatus={handleUpdateStatus}
            onViewDetail={(bill) => {
              setSelectedBill(bill);
              setIsDetailOpen(true);
            }}
          />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-white p-2">
          <div className="text-xs text-gray-500">
            แสดง {(page - 1) * LIMIT + 1}ถึง{" "}
            {Math.min(page * LIMIT, totalItems)}จาก {totalItems}รายการ
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              หน้า {page}/ {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <BillDetailDialog
        onRefresh={fetchBills}
        isOpen={isDetailOpen}
        bill={selectedBill}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBill(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />
      <CreateBillDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateBill}
        selectedDormId={selectedDorm}
        dormName={currentDormName}
      />
    </div>
  );
}
