"use client";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "react-toastify";
import BillTable from "./BillTable";
import CreateBillDialog from "./CreateBillDialog";
import BillDetailDialog from "./BillDetailDialog";
import DormSelector from "./DormSelector";
import BillFilters from "./OwnerBillFilters";
import { BillService } from "@/features/bill/services/bill.service";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Bill } from "@/features/bill/types";
import log from "@/lib/logger";
import { useSearchParams, useRouter } from "next/navigation";
import SendBillModal, { BillSummary } from "./SendBillModal";
import { Feature, ApiResponse_Feature } from "@/features/feature/services";
import { FeatureService } from "@/features/feature/services/feature.service";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  const [features, setFeatures] = useState<
    ApiResponse_Feature<Feature> | undefined
  >();

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

  const sendableBills = bills.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  );
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

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await FeatureService.getFeature("OCR_BILL");
        setFeatures(res);
      } catch (err) {
        log.error("Failed to fetch features:", err);
      }
    };

    fetchFeatures();
  }, []);

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

      await fetchBills();
      setIsCreateOpen(false);
      setIsSendDialogOpen(true);
    } catch (err) {
      log.error("Create Bill Error:", err);
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

  const ERROR_MESSAGES: Record<string, string> = {
    BILL_IDS_REQUIRED: "กรุณาเลือกรายการบิลอย่างน้อย 1 รายการ",
    OWNER_NOT_FOUND: "ไม่พบข้อมูลสิทธิ์การจัดการหอพักของคุณ",
    "Network Error":
      "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  };

  const handleSendBills = async (selectedIds: string[]) => {
    if (!selectedIds || selectedIds.length === 0) return;

    const sendEmailPromise = BillService.sendBillEmails(selectedIds).then(
      (res) => {
        setIsSendDialogOpen(false);
        fetchBills();
        return res;
      },
    );

    toast.promise(sendEmailPromise, {
      pending: "กำลังดำเนินการส่งอีเมลแจ้งเตือน...",
      success: `ส่งแจ้งเตือนจำนวน ${selectedIds.length} รายการสำเร็จ`,

      error: {
        render({ data }: { data: any }) {
          const errorCode =
            data?.response?.data?.message || data?.message || "UNKNOWN_ERROR";
          const thaiMessage =
            ERROR_MESSAGES[errorCode] ||
            (errorCode !== "UNKNOWN_ERROR"
              ? errorCode
              : "เกิดข้อผิดพลาดในการประมวลผล");
          console.error("Send Email Error Details:", data);
          return `แจ้งเตือน: ${thaiMessage}`;
        },
      },
    });
  };

  const handlePrint = async (billIds: string[]) => {
    if (!billIds || billIds.length === 0) return;

    const selectedBills = bills
      .filter((b) => billIds.includes(b.id))
      .sort((a, b) => a.roomNumberSnapshot.localeCompare(b.roomNumberSnapshot));
    let filename = `bills-${new Date().getTime()}.pdf`;

    if (selectedBills.length > 0) {
      const firstRoom = selectedBills[0].roomNumberSnapshot;
      const lastRoom =
        selectedBills[selectedBills.length - 1].roomNumberSnapshot;

      const monthStr = new Date(selectedBills[0].billingMonth)
        .toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
        .replace(" ", "");

      if (selectedBills.length === 1) {
        filename = `Invoice_${firstRoom}_${monthStr}.pdf`;
      } else {
        filename = `Invoices_${firstRoom}_to_${lastRoom}_${monthStr}.pdf`;
      }
    }

    const printPromise = BillService.printBills(billIds).then((blob) => {
      const pdfUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
      return blob;
    });

    toast.promise(printPromise, {
      pending: "กำลังสร้างไฟล์ PDF...",
      success: `สร้างบิล PDF จำนวน ${billIds.length} รายการสำเร็จ`,

      error: {
        render({ data }: { data: any }) {
          const errorCode =
            data?.response?.data?.message || data?.message || "UNKNOWN_ERROR";
          const thaiMessage =
            ERROR_MESSAGES[errorCode] ||
            (errorCode !== "UNKNOWN_ERROR"
              ? errorCode
              : "เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
          console.error("Print Error Details:", data);
          return `พิมพ์ล้มเหลว: ${thaiMessage}`;
        },
      },
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
            type="button"
            disabled={sendableBills.length === 0}
            onClick={() => setIsSendDialogOpen(true)}
            className={`flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium shadow-xs transition-all active:scale-95 ${loading || sendableBills.length === 0 ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-50" : "cursor-pointer border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50"}`}
          >
            <Send size={18} />
            <span>ส่งบิลแจ้งลูกบ้าน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedDorm === "ALL") {
                toast.warning("กรุณาเลือกหอพักก่อนสร้างบิล");
                return;
              }

              setIsCreateOpen(true);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg border bg-linear-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:from-blue-700 hover:to-blue-600 active:scale-95"
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
            onPrint={handlePrint}
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
      {isCreateOpen && (
        <CreateBillDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateBill}
          selectedDormId={selectedDorm}
          dormName={currentDormName}
          ocrFeatureEnabled={features?.data?.enabled || false}
        />
      )}
      {isSendDialogOpen && (
        <SendBillModal
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          bills={sendableBills}
          onSendBills={handleSendBills}
        />
      )}
    </div>
  );
}
