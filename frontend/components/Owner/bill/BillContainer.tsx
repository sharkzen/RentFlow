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
import log from "@/lib/logger";
import { useSearchParams, useRouter } from "next/navigation";
import BillCreateOptionDialog from "./BillCreateOptionDialog";
import MeterScannerDialog from "./MeterScannerDialog";
import MeterScannerPreview from "./MeterScannerPreview";

export default function BillContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter");
  const urlDormId = searchParams.get("dormId");
  const [dorms, setDorms] = useState<any[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<string>(urlDormId || "ALL");
  const [statusFilter, setStatusFilter] = useState<string>(urlFilter || "ALL");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 10;
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOptionOpen, setIsCreateOptionOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewScannerOpen, setIsPreviewScannerOpen] = useState(false);
  const [scannedMeterData, setScannedMeterData] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
    const currentDormId = searchParams.get("dormId") || "ALL";
    const currentFilter = searchParams.get("filter") || "ALL";

    if (currentDormId !== selectedDorm || currentFilter !== statusFilter) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("dormId", selectedDorm);
      params.set("filter", statusFilter);

      router.replace(`?${params.toString()}`, {
        scroll: false,
      });
    }
  }, [selectedDorm, statusFilter, router, searchParams]);

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const res = await DormService.getDorm();

        setDorms([
          {
            id: "ALL",
            name: "หอพักทั้งหมด",
          },
          ...res,
        ]);
      } catch (err) {
        log.error(err);
      }
    };

    fetchDorms();
  }, []);

  useEffect(() => {
    if (selectedDorm) fetchBills();
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
      log.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (data: any) => {
    if (!selectedDorm || selectedDorm === "ALL") {
      toast.error("กรุณาเลือกหอพักที่ต้องการก่อนสร้างบิล");
      return;
    }

    const payload = {
      ...data,
      dormId: selectedDorm,
    };

    try {
      await toast.promise(BillService.createBills(payload), {
        pending: "กำลังสร้างบิล...",
        success: "สร้างบิลสำเร็จเรียบร้อย",

        error: {
          render({ data }: any) {
            const errorResponse = data?.response?.data;
            const errorMsg = errorResponse?.message;

            if (errorMsg === "DORM_SETTINGS_NOT_FOUND") {
              return "กรุณาตั้งค่า 'ค่าน้ำ/ค่าไฟ' ของหอพักก่อนสร้างบิล";
            }

            if (errorMsg === "PAYMENT_METHOD_REQUIRED") {
              return "กรุณาตั้งค่า 'วิธีชำระเงิน' (บัญชีธนาคาร/PromptPay) ก่อน";
            }

            if (errorMsg === "DUPLICATE_BILL_FOUND") {
              const roomNum = errorResponse?.roomNumber || "";
              return `บิลของห้อง ${roomNum} ในรอบเดือนนี้ถูกสร้างไปแล้ว`;
            }

            if (
              errorMsg === "Dormitory ID is required" ||
              errorMsg === "DORM_NOT_FOUND"
            ) {
              return "ไม่พบข้อมูลหอพัก กรุณาลองใหม่อีกครั้ง";
            }

            return "เกิดข้อผิดพลาดในการสร้างบิล กรุณาลองใหม่";
          },
        },
      });

      setIsPreviewScannerOpen(false);
      setScannedMeterData([]);
      fetchBills();
    } catch (err) {
      log.error("Create Bill Error:", err);
      throw err;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await toast
      .promise(BillService.updateStatus(id, status), {
        pending: "กำลังอัปเดตสถานะ...",
        success: "อัปเดตสถานะสำเร็จ",

        error: {
          render({ data }: any) {
            return data?.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ";
          },
        },
      })
      .then(() => {
        fetchBills();
      })
      .catch((err) => {
        log.error("Update Status Error:", err);
      });
  };

  return (
    <div className="relative flex h-[calc(100dvh-2rem)] w-full flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
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
            onClick={() => {
              if (selectedDorm === "ALL") {
                toast.warning("กรุณาเลือกหอพักก่อนสร้างบิล");
                return;
              }

              setIsCreateOptionOpen(true);
            }}
            className="ml-auto flex cursor-pointer gap-2 rounded-lg border bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 active:scale-95 sm:ml-0 sm:items-center"
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
            แสดง {(page - 1) * LIMIT + (totalItems > 0 ? 1 : 0)}ถึง{" "}
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
      {isDetailOpen && selectedBill && (
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
      )}
      <BillCreateOptionDialog
        isOpen={isCreateOptionOpen}
        onClose={() => setIsCreateOptionOpen(false)}
        onSelectManual={() => {
          setIsCreateOptionOpen(false);
          setIsCreateOpen(true);
        }}
        onSelectScan={() => {
          setIsCreateOptionOpen(false);
          setIsScannerOpen(true);
        }}
      />
      <MeterScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        dormId={selectedDorm}
        onComplete={(data) => {
          setIsScannerOpen(false);
          setScannedMeterData(data);
          setIsPreviewScannerOpen(true);
        }}
      />
      <MeterScannerPreview
        isOpen={isPreviewScannerOpen}
        onClose={() => setIsPreviewScannerOpen(false)}
        scannedData={scannedMeterData}
        dormName={currentDormName}
        onSubmit={async (payload) => {
          await handleCreateBill(payload);
        }}
        onRetake={(roomId, type) => {
          setIsPreviewScannerOpen(false);
        }}
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
