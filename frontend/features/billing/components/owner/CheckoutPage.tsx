"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ImagePlus,
  Landmark,
  Megaphone,
  Package,
  QrCode,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { THAI_BANKS } from "@/features/dormitory/components/DormPaymentSettings";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { BillingService } from "../../services/billing.service";
import {
  FEATURE_NAME_BY_KEY,
  featureHref,
  useOwnerBilling,
} from "../../context/OwnerBillingContext";
import { MONTH_LABEL } from "../../lib/pricing";
import type { OrderDetail } from "../../types";

const baht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;

const MAX_SLIP_MB = 8;

function useCountdown(until: string | null, active: boolean) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!until || !active) {
      setLeft(null);
      return;
    }

    const tick = () =>
      setLeft(Math.max(0, new Date(until).getTime() - Date.now()));

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until, active]);

  return left;
}

const mmss = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  } catch {
    toast.error("คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง");
  }
};

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["เลือกแพ็คเกจ", "สรุปและชำระเงิน", "ยืนยันผล"];

  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;

        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white" : "bg-background text-muted border-border border"}`}
            >
              {done ? <CheckCircle2 size={16} /> : n}
            </span>
            <span
              className={`hidden truncate sm:block ${current ? "text-foreground font-semibold" : "text-muted"}`}
            >
              {label}
            </span>
            {n < steps.length && (
              <span
                className={`h-px flex-1 ${done ? "bg-emerald-500" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PriceRow({
  label,
  value,
  tone,
}: {
  label: React.ReactNode;
  value: string;
  tone?: "green";
}) {
  return (
    <div
      className={`flex justify-between gap-3 text-sm ${tone === "green" ? "text-emerald-600" : "text-muted"}`}
    >
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

export default function CheckoutPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { refresh: refreshBilling } = useOwnerBilling();
  // มาจากเมนูที่ถูกล็อก: ชำระสำเร็จแล้วมีปุ่มพากลับหน้านั้นโดยตรง
  const fromFeature = useSearchParams().get("from");
  const nextHref = featureHref(fromFeature);

  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await BillingService.getOrder(orderId);
      setDetail(data);
      setError(null);

      // จ่ายสำเร็จแล้ว: ให้เมนูที่ล็อกอยู่ปลดทันทีโดยไม่ต้องรีเฟรชหน้า
      if (data.order.status === "PAID") refreshBilling();
    } catch (err) {
      setError(getApiErrorMessage(err, "ไม่พบคำสั่งซื้อนี้"));
    }
  }, [orderId, refreshBilling]);

  useEffect(() => {
    load();
  }, [load]);

  // ล้าง object URL ของพรีวิวเมื่อเปลี่ยนรูปหรือออกจากหน้า
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const order = detail?.order;
  const pending = order?.status === "PENDING";
  const countdown = useCountdown(
    order?.type === "PROMOTION" ? (order.holdUntil ?? null) : null,
    !!pending,
  );

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP");
      return;
    }

    if (f.size > MAX_SLIP_MB * 1024 * 1024) {
      toast.error(`ไฟล์ใหญ่เกิน ${MAX_SLIP_MB} MB`);
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file) {
      toast.error("กรุณาแนบรูปสลิปโอนเงิน");
      return;
    }

    setSubmitting(true);
    try {
      const result = await BillingService.uploadSlip(orderId, file);
      toast.success(
        result.status === "PAID"
          ? "ชำระเงินสำเร็จ เปิดใช้งานเรียบร้อย"
          : "ส่งสลิปแล้ว รอผู้ดูแลตรวจสอบ",
      );
      clearFile();
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);

    try {
      await BillingService.cancelOrder(orderId);
      toast.success("ยกเลิกคำสั่งซื้อแล้ว");
      router.push("/owner/billing");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
        <p className="text-foreground font-medium">{error}</p>
        <Link
          href="/owner/billing"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          กลับไปหน้าแพ็คเกจ
        </Link>
      </div>
    );
  }

  if (!detail || !order) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const { payTo, qr } = detail;
  const isPlan = order.type === "PLAN";
  const bank = THAI_BANKS.find((b) => b.id === payTo.bankName);
  const hasPromptPay = !!payTo.promptPayId;
  const hasBank = !!payTo.bankAccountNumber;
  const orderNo = `#${order.id.slice(0, 8).toUpperCase()}`;
  const step: 1 | 2 | 3 = pending ? 2 : 3;

  const summary = (
    <aside className="border-border bg-surface h-fit rounded-2xl border p-6 shadow-sm lg:sticky lg:top-24 lg:order-2 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-bold">สรุปคำสั่งซื้อ</h2>
        <span className="text-muted font-mono text-xs">{orderNo}</span>
      </div>

      <div className="border-border bg-background mt-4 flex items-start gap-3 rounded-xl border p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isPlan ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}
        >
          {isPlan ? <Package size={22} /> : <Megaphone size={22} />}
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-semibold">
            {isPlan
              ? `แพ็คเกจ ${order.plan?.name ?? ""}`
              : `โปรโมทหอพัก`}
          </p>
          <p className="text-muted truncate text-sm">
            {isPlan
              ? `ระยะเวลา ${MONTH_LABEL[order.months] ?? `${order.months} เดือน`}`
              : `${order.dorm?.name ?? ""} · ${MONTH_LABEL[order.months] ?? `${order.months} เดือน`}`}
          </p>
        </div>
      </div>

      {isPlan && order.plan && (
        <ul className="text-muted mt-4 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            {order.plan.maxDorms.toLocaleString("th-TH")} หอพัก ·{" "}
            {order.plan.maxRooms.toLocaleString("th-TH")} ห้อง
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            {order.plan.slipUnlimited
              ? "ตรวจสลิปไม่จำกัด"
              : `ตรวจสลิป ${order.plan.slipQuotaMonthly.toLocaleString("th-TH")} ครั้ง/เดือน`}
          </li>
          <li
            className={`flex items-center gap-2 ${order.plan.hasOcr ? "" : "opacity-50"}`}
          >
            {order.plan.hasOcr ? (
              <CheckCircle2 size={15} className="text-emerald-500" />
            ) : (
              <XCircle size={15} />
            )}
            สแกนมิเตอร์ด้วย OCR
          </li>
        </ul>
      )}

      <div className="border-border mt-5 space-y-2 border-t pt-4">
        <PriceRow label="ราคาปกติ" value={baht(order.listPrice)} />
        {order.termDiscount > 0 && (
          <PriceRow
            label={`ส่วนลด${MONTH_LABEL[order.months] ?? ""}`}
            value={`-${baht(order.termDiscount)}`}
            tone="green"
          />
        )}
        {order.discountAmount > 0 && (
          <PriceRow
            label={
              <>
                ส่วนลดจากโค้ด{" "}
                {order.couponCode && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs">
                    {order.couponCode}
                  </span>
                )}
              </>
            }
            value={`-${baht(order.discountAmount)}`}
            tone="green"
          />
        )}
        <div className="border-border text-foreground flex items-end justify-between border-t pt-3">
          <span className="font-medium">ยอดที่ต้องชำระ</span>
          <span className="text-2xl font-bold text-blue-600">
            {baht(order.finalAmount)}
          </span>
        </div>
        {order.termDiscount + order.discountAmount > 0 && (
          <p className="text-right text-xs text-emerald-600">
            ประหยัดไป {baht(order.termDiscount + order.discountAmount)}
          </p>
        )}
      </div>

      {pending && countdown !== null && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${countdown > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
        >
          <Clock size={14} />
          {countdown > 0
            ? `จองช่องโปรโมทไว้อีก ${mmss(countdown)} นาที`
            : "หมดเวลาจองช่อง ระบบจะตรวจช่องว่างอีกครั้งตอนส่งสลิป"}
        </div>
      )}
    </aside>
  );

  const paymentPanel = pending && (
    <section className="space-y-6 lg:order-1 lg:col-span-3">
      <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-foreground text-lg font-bold">
            1. โอนเงินตามยอด
          </h2>
          <button
            onClick={() => copy(String(order.finalAmount), "ยอดเงิน")}
            className="text-muted hover:bg-background flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
          >
            <Copy size={13} />
            คัดลอกยอด {baht(order.finalAmount)}
          </button>
        </div>

        {!hasPromptPay && !hasBank ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            ระบบยังไม่ได้ตั้งค่าบัญชีรับเงิน กรุณาติดต่อผู้ดูแลระบบ
          </p>
        ) : (
          <div
            className={`mt-5 grid gap-5 ${hasPromptPay && hasBank ? "md:grid-cols-2" : ""}`}
          >
            {hasPromptPay && (
              <div className="border-border bg-background flex flex-col items-center rounded-xl border p-5 text-center">
                <p className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                  <QrCode size={16} className="text-blue-600" />
                  สแกนจ่ายผ่านพร้อมเพย์
                </p>
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt="QR PromptPay"
                    className="h-52 w-52 rounded-lg bg-white p-2"
                  />
                ) : (
                  <div className="h-52 w-52 animate-pulse rounded-lg bg-white/60" />
                )}
                {payTo.promptPayName && (
                  <p className="text-foreground mt-3 text-sm font-medium">
                    {payTo.promptPayName}
                  </p>
                )}
                <p className="text-muted text-xs">
                  QR มียอด {baht(order.finalAmount)} ใส่ไว้ให้แล้ว
                </p>
              </div>
            )}

            {hasBank && (
              <div className="border-border bg-background flex flex-col rounded-xl border p-5">
                <p className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Landmark size={16} className="text-blue-600" />
                  โอนเข้าบัญชีธนาคาร
                </p>
                <div className="flex items-center gap-3">
                  {bank?.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="h-11 w-11 rounded-lg bg-white object-contain p-1"
                    />
                  )}
                  <p className="text-foreground text-sm font-medium">
                    {bank?.name ?? payTo.bankName}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-muted text-xs">เลขที่บัญชี</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground font-mono text-xl font-bold tracking-wide">
                      {payTo.bankAccountNumber}
                    </p>
                    <button
                      onClick={() =>
                        copy(
                          payTo.bankAccountNumber.replace(/[^0-9]/g, ""),
                          "เลขบัญชี",
                        )
                      }
                      aria-label="คัดลอกเลขบัญชี"
                      className="text-muted hover:bg-surface cursor-pointer rounded-lg border p-2 transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
                {payTo.bankAccountName && (
                  <div className="mt-3">
                    <p className="text-muted text-xs">ชื่อบัญชี</p>
                    <p className="text-foreground text-sm font-medium">
                      {payTo.bankAccountName}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground text-lg font-bold">
          2. แนบสลิปโอนเงิน
        </h2>
        <p className="text-muted mt-1 text-sm">
          ระบบตรวจสลิปให้อัตโนมัติ หากผ่านจะเปิดใช้งานทันที
        </p>

        {preview ? (
          <div className="border-border bg-background mt-4 flex items-center gap-4 rounded-xl border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="ตัวอย่างสลิป"
              className="h-24 w-20 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {file?.name}
              </p>
              <p className="text-muted text-xs">
                {file ? (file.size / 1024).toFixed(0) : 0} KB
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-1 cursor-pointer text-xs text-blue-600 hover:underline"
              >
                เปลี่ยนรูป
              </button>
            </div>
            <button
              onClick={clearFile}
              aria-label="ลบรูป"
              className="text-muted cursor-pointer rounded-lg p-2 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-9 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-border hover:bg-background"}`}
          >
            <ImagePlus size={30} className="text-muted" />
            <span className="text-foreground text-sm font-medium">
              คลิกเพื่อเลือกรูป หรือลากมาวางที่นี่
            </span>
            <span className="text-muted text-xs">
              JPG, PNG, WEBP ไม่เกิน {MAX_SLIP_MB} MB
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        <button
          onClick={submit}
          disabled={submitting || !file || (!hasPromptPay && !hasBank)}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              กำลังตรวจสอบสลิป...
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              ยืนยันการชำระเงิน {baht(order.finalAmount)}
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted">
            ชำระผิดยอดหรือผิดบัญชี ระบบจะส่งให้ผู้ดูแลตรวจสอบเอง
          </span>
          <button
            onClick={() => setCancelOpen(true)}
            className="text-muted cursor-pointer hover:text-red-600"
          >
            ยกเลิกคำสั่งซื้อ
          </button>
        </div>
      </div>
    </section>
  );

  const resultPanel = !pending && (
    <section className="lg:order-1 lg:col-span-3">
      <div className="border-border bg-surface rounded-2xl border p-8 text-center shadow-sm">
        {order.status === "PAID" && (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-11 w-11 text-emerald-600" />
            </div>
            <h2 className="text-foreground text-2xl font-bold">
              ชำระเงินสำเร็จ
            </h2>
            <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
              {isPlan
                ? `เปิดใช้งานแพ็คเกจ ${order.plan?.name ?? ""} เรียบร้อยแล้ว ใช้งานได้ทุกฟีเจอร์ตามแพ็คเกจทันที`
                : `หอ ${order.dorm?.name ?? ""} จะแสดงเป็นหอโปรโมทในหน้าแรกและผลการค้นหาแล้ว`}
            </p>
          </>
        )}

        {order.status === "PENDING_REVIEW" && (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-11 w-11 text-blue-600" />
            </div>
            <h2 className="text-foreground text-2xl font-bold">
              ส่งสลิปแล้ว รอตรวจสอบ
            </h2>
            <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
              ผู้ดูแลระบบกำลังตรวจสอบสลิปของคุณ เมื่ออนุมัติแล้วระบบจะเปิดใช้งานให้ทันที
              {order.note ? ` (${order.note})` : ""}
            </p>
            <button
              onClick={load}
              className="border-border text-foreground/80 hover:bg-background mt-5 cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-medium"
            >
              ตรวจสอบสถานะอีกครั้ง
            </button>
          </>
        )}

        {order.status === "REJECTED" && (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-11 w-11 text-red-600" />
            </div>
            <h2 className="text-foreground text-2xl font-bold">
              ไม่อนุมัติคำสั่งซื้อ
            </h2>
            <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
              {order.note
                ? `เหตุผล: ${order.note}`
                : "สลิปไม่ผ่านการตรวจสอบ กรุณาสั่งซื้อใหม่หรือติดต่อผู้ดูแล"}
            </p>
          </>
        )}

        {order.status === "EXPIRED" && (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <XCircle className="h-11 w-11 text-slate-500" />
            </div>
            <h2 className="text-foreground text-2xl font-bold">
              คำสั่งซื้อหมดอายุ/ถูกยกเลิก
            </h2>
            <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
              สร้างคำสั่งซื้อใหม่ได้จากหน้าแพ็คเกจ
            </p>
          </>
        )}

        {order.slipUrls.length > 0 && (
          <div className="mt-6 flex justify-center gap-3">
            {order.slipUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="สลิปที่แนบ"
                className="border-border h-32 rounded-lg border object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {order.status === "PAID" && (
            <Link
              href={nextHref ?? "/owner/dashboard"}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {nextHref
                ? `ไปที่${FEATURE_NAME_BY_KEY[fromFeature ?? ""] ?? "หน้าที่ต้องการ"}`
                : "ไปที่หน้าภาพรวม"}
            </Link>
          )}
          <Link
            href="/owner/billing"
            className="border-border text-foreground/80 hover:bg-background rounded-xl border px-6 py-3 text-sm font-medium"
          >
            กลับไปหน้าแพ็คเกจ
          </Link>
        </div>
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/owner/billing"
        className="text-muted hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft size={16} />
        กลับไปเลือกแพ็คเกจ
      </Link>

      <div className="mb-6">
        <Stepper step={step} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {summary}
        {paymentPanel}
        {resultPanel}
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        isLoading={cancelling}
        type="warning"
        title="ยกเลิกคำสั่งซื้อนี้?"
        description={`คำสั่งซื้อ ${orderNo} จะถูกยกเลิก หากโอนเงินไปแล้วกรุณาอย่ายกเลิก แต่แนบสลิปเพื่อยืนยันการชำระ`}
        confirmText="ยกเลิกคำสั่งซื้อ"
        cancelText="กลับไปชำระเงิน"
      />
    </div>
  );
}
