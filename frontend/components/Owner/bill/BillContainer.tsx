"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Building,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import BillTable from "./BillTable";
import CreateBillDialog from "./CreateBillDialog";
import BillDetailDialog from "./BillDetailDialog";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { BillService } from "@/features/bill/services/bill.service";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Bill } from "@/features/bill/types";

export default function BillContainer() {
  const [dorms, setDorms] = useState<any[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isDormDropdownOpen, setIsDormDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
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
  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label || "สถานะ";

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (data: any) => {
    try {
      await BillService.createBills({
        ...data,
        dormId: selectedDorm,
      });

      toast.success("สร้างบิลเรียบร้อยแล้ว");
      setIsCreateOpen(false);
      fetchBills();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการสร้างบิล");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return;

    try {
      await BillService.updateStatus(id, status);
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchBills();
    } catch (err) {
      toast.error("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
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
          <div className="relative min-w-40">
            <button
              onClick={() => setIsDormDropdownOpen(!isDormDropdownOpen)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-indigo-100"
            >
              <div className="flex items-center gap-2 truncate">
                <Building size={16} className="text-indigo-600" />
                <span className="max-w-30 truncate">{currentDormName}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${isDormDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isDormDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDormDropdownOpen(false)}
                />
                <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-xl border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
                    เลือกหอพัก
                  </div>
                  {dorms.map((dorm) => (
                    <button
                      key={dorm.id}
                      onClick={() => {
                        setSelectedDorm(dorm.id);
                        setIsDormDropdownOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${selectedDorm === dorm.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <span>{dorm.name}</span>
                      {selectedDorm === dorm.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-95"
          >
            <Plus size={18} />
            <span>สร้างบิล</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:flex md:items-center md:justify-between lg:p-4">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขห้อง / ชื่อ..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pr-4 pl-9 text-sm transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-auto">
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>
          <div className="hidden h-6 w-px bg-gray-200 sm:block"></div>

          <div className="relative w-full min-w-35 sm:w-auto">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm hover:border-gray-300 focus:ring-2 focus:ring-indigo-100"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <span className="text-gray-700">{currentStatusLabel}</span>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {isStatusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setIsStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border bg-white p-1 shadow-lg">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span className={opt.color}>{opt.label}</span>
                      {statusFilter === opt.value && (
                        <Check size={14} className="text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[65vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 overflow-auto">
          <div className="min-w-200">
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
        </div>
        <div className="bg-gray-50 p-2 text-center text-xs text-gray-500">
          แสดงทั้งหมด {bills.length}รายการ
        </div>
      </div>

      <BillDetailDialog
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
