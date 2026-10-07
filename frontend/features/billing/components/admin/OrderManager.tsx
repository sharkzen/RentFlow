"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ReceiptText, X } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { AdminOrder, OrderStatus } from "../../types";

const STATUS: Record<OrderStatus, { text: string; cls: string }> = {
  PENDING: {
    text: "รอชำระเงิน",
    cls: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PENDING_REVIEW: {
    text: "รอตรวจสอบ",
    cls: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PAID: {
    text: "ชำระแล้ว",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REJECTED: { text: "ไม่อนุมัติ", cls: "border-red-200 bg-red-50 text-red-700" },
  EXPIRED: { text: "หมดอายุ", cls: "border-border bg-background text-muted" },
};

const baht = (n: number) =>
  `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ฿`;

const selectClass =
  "border-border bg-surface text-foreground rounded-xl border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function OrderManager() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [slips, setSlips] = useState<string[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminBillingService.getOrders({
        status: status || undefined,
        type: type || undefined,
        page,
        limit: 15,
      });
      setOrders(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดข้อมูลได้"));
    } finally {
      setLoading(false);
    }
  }, [status, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (order: AdminOrder) => {
    setSelected(order);
    setNote("");
    setSlips(null);
    try {
      setSlips(await AdminBillingService.getOrderSlips(order.id));
    } catch (error) {
      setSlips([]);
      toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดสลิปได้"));
    }
  };

  const review = async (action: "APPROVE" | "REJECT") => {
    if (!selected) return;
    setBusy(true);
    try {
      await AdminBillingService.reviewOrder(selected.id, action, note);
      toast.success(action === "APPROVE" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว");
      setSelected(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <ReceiptText size={24} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              คำสั่งซื้อและสลิป
            </h1>
            <p className="text-muted mt-1 text-sm">
              ตรวจสอบสลิปที่ระบบอนุมัติอัตโนมัติไม่ได้
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">ทุกสถานะ</option>
            {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].text}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">ทุกประเภท</option>
            <option value="PLAN">แพ็คเกจ</option>
            <option value="PROMOTION">โปรโมทหอ</option>
          </select>
        </div>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted w-full text-left text-sm">
            <thead className="border-border bg-background/50 border-b text-xs uppercase">
              <tr>
                {["วันที่", "เจ้าของหอ", "รายการ", "ยอด", "สถานะ", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-6 py-4 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    ไม่พบคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-background/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-foreground font-medium">
                        {o.owner.fullName}
                      </div>
                      <div className="text-xs">{o.owner.user.email}</div>
                    </td>
                    <td className="text-foreground px-6 py-4 whitespace-nowrap">
                      {o.type === "PLAN"
                        ? `แพ็คเกจ ${o.plan?.name ?? ""}`
                        : `โปรโมท ${o.dorm?.name ?? ""}`}{" "}
                      <span className="text-muted">({o.months} เดือน)</span>
                      {o.coupon && (
                        <div className="text-xs text-emerald-600">
                          คูปอง {o.coupon.code}
                        </div>
                      )}
                    </td>
                    <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                      {baht(o.finalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS[o.status].cls}`}
                      >
                        {STATUS[o.status].text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => open(o)}
                        className="cursor-pointer rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        {o.status === "PENDING_REVIEW" ? "ตรวจสอบ" : "ดูสลิป"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-border text-muted flex items-center justify-between border-t p-4 text-sm">
          <span>
            หน้า {page} จาก {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-border text-foreground/80 hover:bg-background cursor-pointer rounded-lg border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-border text-foreground/80 hover:bg-background cursor-pointer rounded-lg border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="bg-surface my-auto w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-foreground text-lg font-bold">
                ตรวจสอบคำสั่งซื้อ
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted hover:bg-background cursor-pointer rounded-full p-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-6 text-sm">
              <div className="border-border bg-background space-y-1 rounded-xl border p-4">
                <div className="flex justify-between">
                  <span className="text-muted">เจ้าของหอ</span>
                  <span className="text-foreground">
                    {selected.owner.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">ยอดที่ต้องโอน</span>
                  <span className="text-foreground font-bold">
                    {baht(selected.finalAmount)}
                  </span>
                </div>
                {selected.note && (
                  <p className="pt-1 text-xs text-amber-700">{selected.note}</p>
                )}
              </div>

              {slips === null ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : slips.length === 0 ? (
                <p className="text-muted text-center">ไม่มีสลิปแนบ</p>
              ) : (
                slips.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt="สลิป"
                    className="border-border max-h-96 w-full rounded-xl border object-contain"
                  />
                ))
              )}

              {selected.status === "PENDING_REVIEW" && (
                <>
                  <div className="flex gap-3">
                    <button
                      disabled={busy}
                      onClick={() => {
                        setNote("");
                        setConfirmAction("REJECT");
                      }}
                      className="flex-1 cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => setConfirmAction("APPROVE")}
                      className="flex-1 cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      อนุมัติ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => !busy && setConfirmAction(null)}
        onConfirm={() => confirmAction && review(confirmAction)}
        isLoading={busy}
        type={confirmAction === "REJECT" ? "error" : "success"}
        title={
          confirmAction === "REJECT"
            ? "ปฏิเสธคำสั่งซื้อนี้?"
            : "อนุมัติคำสั่งซื้อนี้?"
        }
        description={
          confirmAction === "REJECT"
            ? "กรุณาระบุเหตุผล ข้อความนี้จะแสดงให้เจ้าของหอเห็น (หากโอนเงินมาแล้วต้องคืนเงินนอกระบบ)"
            : `ยืนยันว่าได้รับเงิน ${selected ? selected.finalAmount.toLocaleString("th-TH") : ""} บาทแล้ว ระบบจะเปิดใช้งานแพ็คเกจ/โปรโมทให้ทันที`
        }
        confirmText={confirmAction === "REJECT" ? "ปฏิเสธ" : "อนุมัติ"}
        showInput={confirmAction === "REJECT"}
        inputValue={note}
        onInputChange={setNote}
        inputPlaceholder="เช่น ยอดโอนไม่ตรง หรือสลิปไม่ชัดเจน"
        inputMaxLength={300}
        confirmDisabled={confirmAction === "REJECT" && note.trim().length < 3}
      />
    </>
  );
}
