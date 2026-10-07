"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Package, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/backendError";
import { formatThaiDate } from "@/lib/dateFormatter";
import { AdminBillingService } from "../../services/admin-billing.service";
import type {
  OwnerSubscriptionAction,
  OwnerSubscriptionInfo,
  SubscriptionState,
} from "../../types";

type Dialog =
  | { kind: "GRANT" }
  | { kind: "EXTEND" }
  | { kind: "SET_END" }
  | { kind: "CANCEL" }
  | { kind: "CANCEL_PROMO"; id: string; dormName: string };

const STATUS: Record<SubscriptionState, { text: string; cls: string }> = {
  FREE: { text: "ยังไม่มีแพ็คเกจ", cls: "border-border bg-background text-muted" },
  TRIAL: { text: "ทดลองใช้", cls: "border-blue-200 bg-blue-50 text-blue-700" },
  ACTIVE: {
    text: "ใช้งานอยู่",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  GRACE: {
    text: "ผ่อนผัน (อ่านอย่างเดียว)",
    cls: "border-amber-200 bg-amber-50 text-amber-700",
  },
  EXPIRED: { text: "หมดอายุ", cls: "border-red-200 bg-red-50 text-red-700" },
  CANCELED: { text: "ยกเลิก", cls: "border-red-200 bg-red-50 text-red-700" },
};

const ORDER_STATUS: Record<string, string> = {
  PENDING: "รอชำระ",
  PENDING_REVIEW: "รอตรวจสลิป",
  PAID: "ชำระแล้ว",
  REJECTED: "ไม่อนุมัติ",
  EXPIRED: "หมดอายุ",
  REFUNDED: "คืนเงินแล้ว",
};

const inputClass =
  "border-border bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

const baht = (n: number) =>
  `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ฿`;

const daysLeft = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

/** จัดการแพ็คเกจของเจ้าของหอรายคนโดยแอดมิน: ให้แพ็ค ต่ออายุ ตั้งวันหมด ยกเลิก และยกเลิกโปรโมท */
export default function OwnerSubscriptionPanel({
  ownerId,
}: {
  ownerId: string;
}) {
  const [info, setInfo] = useState<OwnerSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);

  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("30");
  const [trial, setTrial] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await AdminBillingService.getOwnerSubscription(ownerId);
      setInfo(data);
      setPlanId((prev) => prev || data.plans[0]?.id || "");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดข้อมูลแพ็คเกจได้"));
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDialog = (d: Dialog) => {
    setReason("");
    setTrial(false);
    setDays("30");
    setEndDate("");
    setDialog(d);
  };

  const dayCount = Number(days);
  const daysValid =
    Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 3650;

  const canSubmit =
    !busy &&
    reason.trim().length >= 3 &&
    (dialog?.kind === "GRANT"
      ? !!planId && daysValid
      : dialog?.kind === "EXTEND"
        ? daysValid
        : dialog?.kind === "SET_END"
          ? !!endDate
          : true);

  const submit = async () => {
    if (!dialog) return;
    setBusy(true);

    try {
      const r = reason.trim();

      if (dialog.kind === "CANCEL_PROMO") {
        await AdminBillingService.cancelPromotion(dialog.id, r);
      } else {
        const payload: OwnerSubscriptionAction =
          dialog.kind === "GRANT"
            ? { action: "GRANT", planId, days: dayCount, trial, reason: r }
            : dialog.kind === "EXTEND"
              ? { action: "EXTEND", days: dayCount, reason: r }
              : dialog.kind === "SET_END"
                ? {
                    action: "SET_END",
                    endsAt: new Date(`${endDate}T23:59:59`).toISOString(),
                    reason: r,
                  }
                : { action: "CANCEL", reason: r };

        await AdminBillingService.updateOwnerSubscription(ownerId, payload);
      }

      toast.success("บันทึกเรียบร้อย และแจ้งเจ้าของหอทางอีเมลแล้ว");
      setDialog(null);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="border-border bg-surface flex justify-center rounded-xl border p-8 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!info) return null;

  const sub = info.subscription;
  const status = STATUS[sub?.status ?? "FREE"];
  const canceled = sub?.status === "CANCELED";

  const dialogTitle =
    dialog?.kind === "GRANT"
      ? "ให้แพ็คเกจ"
      : dialog?.kind === "EXTEND"
        ? "ต่ออายุแพ็คเกจ"
        : dialog?.kind === "SET_END"
          ? "ตั้งวันหมดอายุ"
          : dialog?.kind === "CANCEL"
            ? "ยกเลิกแพ็คเกจ"
            : `ยกเลิกโปรโมท ${dialog?.kind === "CANCEL_PROMO" ? dialog.dormName : ""}`;

  return (
    <div className="border-border bg-surface rounded-xl border shadow-sm">
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-blue-500" />
          แพ็คเกจและสมาชิก
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
        >
          {status.text}
        </span>
      </div>

      <div className="space-y-4 p-6 text-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-muted text-xs">แพ็คเกจ</p>
            <p className="text-foreground font-semibold">
              {sub?.planName ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs">วันหมดอายุ</p>
            <p className="text-foreground font-semibold">
              {sub?.currentPeriodEnd
                ? formatThaiDate(sub.currentPeriodEnd, "short-datetime")
                : "-"}
              {sub?.currentPeriodEnd &&
                (sub.status === "ACTIVE" || sub.status === "TRIAL") && (
                  <span className="text-muted ml-1 text-xs font-normal">
                    (เหลือ {Math.max(0, daysLeft(sub.currentPeriodEnd))} วัน)
                  </span>
                )}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs">ที่ใช้อยู่</p>
            <p className="text-foreground font-semibold">
              {info.usage.dorms} หอ · {info.usage.rooms} ห้อง
            </p>
          </div>
        </div>

        {info.trial.blocked && (
          <p className="text-xs text-amber-700">
            บัญชีนี้ถูกตัดสิทธิ์ทดลองฟรี
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openDialog({ kind: "GRANT" })}
            className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            ให้แพ็คเกจ
          </button>
          {sub && (
            <>
              <button
                onClick={() => openDialog({ kind: "EXTEND" })}
                className="border-border text-foreground/80 hover:bg-background cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                ต่ออายุ
              </button>
              <button
                onClick={() => openDialog({ kind: "SET_END" })}
                className="border-border text-foreground/80 hover:bg-background cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                ตั้งวันหมดอายุ
              </button>
              {!canceled && (
                <button
                  onClick={() => openDialog({ kind: "CANCEL" })}
                  className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  ยกเลิกแพ็คเกจ
                </button>
              )}
            </>
          )}
        </div>

        {info.promotions.length > 0 && (
          <div>
            <p className="text-muted mb-2 text-xs">โปรโมทที่กำลังแสดง</p>
            <ul className="border-border divide-border divide-y rounded-lg border">
              {info.promotions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="text-foreground">
                    {p.dormName}
                    <span className="text-muted ml-2 text-xs">
                      ถึง {formatThaiDate(p.endsAt, "short")}
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      openDialog({
                        kind: "CANCEL_PROMO",
                        id: p.id,
                        dormName: p.dormName,
                      })
                    }
                    className="cursor-pointer text-xs text-red-600 hover:underline"
                  >
                    ยกเลิก
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {info.orders.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-muted text-xs">คำสั่งซื้อล่าสุด</p>
              <Link
                href="/admin/billing-orders"
                className="text-xs text-blue-600 hover:underline"
              >
                ไปหน้าคำสั่งซื้อ (คืนเงินได้ที่นั่น)
              </Link>
            </div>
            <ul className="border-border divide-border divide-y rounded-lg border text-xs">
              {info.orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="text-foreground">
                    {o.label}{" "}
                    <span className="text-muted">({o.months} เดือน)</span>
                  </span>
                  <span className="text-muted shrink-0">
                    {baht(o.finalAmount)} · {ORDER_STATUS[o.status] ?? o.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-surface w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
              <h4 className="text-foreground text-base font-bold">
                {dialogTitle}
              </h4>
              <button
                onClick={() => !busy && setDialog(null)}
                className="text-muted hover:bg-background cursor-pointer rounded-full p-2"
                aria-label="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6 text-sm">
              {dialog.kind === "GRANT" && (
                <>
                  <div>
                    <label className="text-foreground/80 mb-1 block text-xs font-medium">
                      แพ็คเกจ
                    </label>
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className={inputClass}
                    >
                      {info.plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.maxDorms} หอ {p.maxRooms} ห้อง)
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="text-foreground flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={trial}
                      onChange={(e) => setTrial(e.target.checked)}
                    />
                    ให้ในฐานะทดลองใช้ (ไม่นับเป็นแพ็คเกจที่ชำระ)
                  </label>
                </>
              )}

              {(dialog.kind === "GRANT" || dialog.kind === "EXTEND") && (
                <div>
                  <label className="text-foreground/80 mb-1 block text-xs font-medium">
                    {dialog.kind === "GRANT"
                      ? "ระยะเวลา (วัน) นับจากวันนี้"
                      : "ต่อเพิ่ม (วัน)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className={inputClass}
                  />
                  {!daysValid && (
                    <p className="mt-1 text-xs text-red-600">
                      กรอกจำนวนวัน 1 - 3650
                    </p>
                  )}
                </div>
              )}

              {dialog.kind === "SET_END" && (
                <div>
                  <label className="text-foreground/80 mb-1 block text-xs font-medium">
                    วันหมดอายุใหม่ (สิ้นสุดเวลา 23:59 น.)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {dialog.kind === "CANCEL" && (
                <p className="text-muted text-xs">
                  เจ้าของหอจะดูข้อมูลได้อย่างเดียว เพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้
                  จนกว่าจะให้แพ็คเกจหรือต่ออายุใหม่
                </p>
              )}

              {dialog.kind === "CANCEL_PROMO" && (
                <p className="text-muted text-xs">
                  หอนี้จะหายจากลำดับโปรโมททันที
                  การยกเลิกนี้ไม่ได้คืนเงินให้อัตโนมัติ (บันทึกคืนเงินที่หน้าคำสั่งซื้อ)
                </p>
              )}

              <div>
                <label className="text-foreground/80 mb-1 block text-xs font-medium">
                  เหตุผล (บันทึกใน log ไม่แสดงให้เจ้าของหอ)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="เช่น ลูกค้าโอนผิดบัญชี ขอเพิ่มวันให้ตามที่ตกลง"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <p className="text-muted text-xs">
                ระบบจะส่งอีเมลแจ้งเจ้าของหอเมื่อบันทึก
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDialog(null)}
                  disabled={busy}
                  className="border-border text-foreground/80 hover:bg-background flex-1 cursor-pointer rounded-lg border px-4 py-2.5 font-medium disabled:opacity-60"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className={`flex-1 cursor-pointer rounded-lg px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    dialog.kind === "CANCEL" || dialog.kind === "CANCEL_PROMO"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {busy ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
