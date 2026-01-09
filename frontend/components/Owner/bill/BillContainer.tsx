"use client";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
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
  }, [selectedDorm, statusFilter, selectedMonth]);

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
      };

      if (statusFilter !== "ALL") params.status = statusFilter;

      if (selectedMonth) {
        const year = selectedMonth.getFullYear();
        const month = String(selectedMonth.getMonth() + 1).padStart(2, "0");
        params.month = `${year}-${month}`;
      }

      const res = await BillService.getBills(selectedDorm, params);
      setBills(res.items);

      if (selectedBill) {
        const updatedSelectedBill = res.items.find(
          (b: Bill) => b.id === selectedBill.id,
        );

        if (updatedSelectedBill) {
          setSelectedBill(updatedSelectedBill);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (data: any) => {
    const createPromise = BillService.createBills({
      ...data,
      dormId: selectedDorm,
    });

    toast.promise(createPromise, {
      pending: "กำลังสร้างบิล...",
      success: "สร้างบิลเรียบร้อยแล้ว",

      error: {
        render({ data }: any) {
          const errorMsg =
            data?.response?.data?.message ||
            data?.message ||
            "เกิดข้อผิดพลาดในการสร้างบิล";
          return `เกิดข้อผิดพลาด: ${errorMsg}`;
        },
      },
    });

    try {
      await createPromise;
      setIsCreateOpen(false);
      fetchBills();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const updatePromise = BillService.updateStatus(id, status);

    toast.promise(updatePromise, {
      pending: "กำลังอัปเดตสถานะ...",
      success: "อัปเดตสถานะเรียบร้อย",

      error: {
        render({ data }: any) {
          const errorMsg =
            data?.response?.data?.message ||
            data?.message ||
            "อัปเดตสถานะไม่สำเร็จ";
          return `เกิดข้อผิดพลาด: ${errorMsg}`;
        },
      },
    });

    try {
      await updatePromise;
      fetchBills();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex h-[calc(100dvh-2rem)] w-full flex-col gap-4 pb-20 sm:h-auto sm:pb-0">
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
            className="hidden cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-95 sm:flex"
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
        <div className="border-t border-gray-100 bg-gray-50 p-2 text-center text-xs text-gray-500">
          แสดงทั้งหมด {bills.length}รายการ
        </div>
      </div>
      <div className="fixed right-6 bottom-6 z-40 sm:hidden">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-90"
        >
          <Plus size={28} />
        </button>
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
