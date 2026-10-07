"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  Megaphone,
  Package,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { BillingService } from "../../services/billing.service";
import type {
  BillingOrder,
  CouponPreview,
  MyBilling,
  OrderQr,
  Plan,
  SubscriptionState,
} from "../../types";

const baht = (n: number) =>
  `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ฿`;

const dateTh = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const MONTH_OPTIONS = [1, 3, 6, 12];

const STATUS_LABEL: Record<SubscriptionState, { text: string; cls: string }> = {
  FREE: { text: "แพ็คเกจฟรี", cls: "border-border bg-background text-muted" },
  TRIAL: {
    text: "ทดลองใช้ฟรี",
    cls: "border-blue-200 bg-blue-50 text-blue-700",
  },
  ACTIVE: {
    text: "ใช้งานอยู่",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  GRACE: {
    text: "หมดอายุ (ระยะผ่อนผัน)",
    cls: "border-amber-200 bg-amber-50 text-amber-700",
  },
  EXPIRED: { text: "หมดอายุ", cls: "border-red-200 bg-red-50 text-red-700" },
  CANCELED: {
    text: "ยกเลิกแล้ว",
    cls: "border-border bg-background text-muted",
  },
};

const ORDER_LABEL: Record<BillingOrder["status"], { text: string; cls: string }> =
  {
    PENDING: {
      text: "รอชำระเงิน",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
    PENDING_REVIEW: {
      text: "รอตรวจสอบสลิป",
      cls: "border-blue-200 bg-blue-50 text-blue-700",
    },
    PAID: {
      text: "ชำระแล้ว",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    REJECTED: { text: "ไม่อนุมัติ", cls: "border-red-200 bg-red-50 text-red-700" },
    EXPIRED: { text: "หมดอายุ/ยกเลิก", cls: "border-border bg-background text-muted" },
  };

const inputClass =
  "border-border w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="bg-surface my-auto w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:bg-background hover:text-foreground cursor-pointer rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

type Checkout =
  | { kind: "PLAN"; plan: Plan }
  | { kind: "PROMOTION" };

function CheckoutModal({
  checkout,
  billing,
  dorms,
  onClose,
  onCreated,
}: {
  checkout: Checkout;
  billing: MyBilling;
  dorms: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (order: BillingOrder) => void;
}) {
  const [months, setMonths] = useState(1);
  const [dormId, setDormId] = useState(dorms[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [busy, setBusy] = useState(false);

  const unit =
    checkout.kind === "PLAN"
      ? checkout.plan.priceMonthly
      : billing.promotion.pricePerMonth;
  const base = unit * months;
  const shown = preview ?? {
    baseAmount: base,
    discountAmount: 0,
    finalAmount: base,
  };

  // เปลี่ยนจำนวนเดือนแล้วราคาเปลี่ยน ต้องคำนวณส่วนลดใหม่
  const changeMonths = (m: number) => {
    setMonths(m);
    setPreview(null);
  };

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      setPreview(
        await BillingService.previewCoupon({
          code,
          type: checkout.kind,
          planId: checkout.kind === "PLAN" ? checkout.plan.id : undefined,
          months,
        }),
      );
    } catch (error) {
      setPreview(null);
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (checkout.kind === "PROMOTION" && !dormId) {
      toast.error("กรุณาเลือกหอพักที่ต้องการโปรโมท");
      return;
    }

    setBusy(true);
    try {
      const order = await BillingService.createOrder({
        type: checkout.kind,
        planId: checkout.kind === "PLAN" ? checkout.plan.id : undefined,
        dormId: checkout.kind === "PROMOTION" ? dormId : undefined,
        months,
        couponCode: preview ? code.trim() : undefined,
      });
      onCreated(order);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        checkout.kind === "PLAN"
          ? `สั่งซื้อแพ็คเกจ ${checkout.plan.name}`
          : "โปรโมทหอพัก"
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {checkout.kind === "PROMOTION" && (
          <div>
            <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
              เลือกหอพัก
            </label>
            {dorms.length === 0 ? (
              <p className="text-muted text-sm">ยังไม่มีหอพักให้โปรโมท</p>
            ) : (
              <select
                value={dormId}
                onChange={(e) => setDormId(e.target.value)}
                className={inputClass}
              >
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
            ระยะเวลา
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMonths(m)}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${months === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border text-muted hover:bg-background"}`}
              >
                {m} เดือน
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
            โค้ดส่วนลด
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setPreview(null);
              }}
              className={inputClass}
              placeholder="ถ้ามี"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={busy || !code.trim()}
              className="border-border text-foreground/80 hover:bg-background cursor-pointer rounded-xl border px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              ใช้โค้ด
            </button>
          </div>
        </div>

        <div className="border-border bg-background space-y-1.5 rounded-xl border p-4 text-sm">
          <div className="text-muted flex justify-between">
            <span>
              ราคา {baht(unit)} x {months} เดือน
            </span>
            <span>{baht(shown.baseAmount)}</span>
          </div>
          {shown.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>ส่วนลด</span>
              <span>-{baht(shown.discountAmount)}</span>
            </div>
          )}
          <div className="text-foreground border-border flex justify-between border-t pt-2 text-base font-bold">
            <span>ยอดชำระ</span>
            <span>{baht(shown.finalAmount)}</span>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy || (checkout.kind === "PROMOTION" && !dormId)}
          className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "กำลังดำเนินการ..." : "สร้างคำสั่งซื้อ"}
        </button>
      </div>
    </Modal>
  );
}

function PayModal({
  order,
  onClose,
  onDone,
}: {
  order: BillingOrder;
  onClose: () => void;
  onDone: () => void;
}) {
  const [qr, setQr] = useState<OrderQr | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    BillingService.getOrderQr(order.id)
      .then(setQr)
      .catch((error) => toast.error(getApiErrorMessage(error)));
  }, [order.id]);

  const submit = async () => {
    if (!file) {
      toast.error("กรุณาเลือกรูปสลิป");
      return;
    }

    setBusy(true);
    try {
      const result = await BillingService.uploadSlip(order.id, file);
      toast.success(
        result.status === "PAID"
          ? "ชำระเงินสำเร็จ เปิดใช้งานเรียบร้อย"
          : "ส่งสลิปแล้ว รอแอดมินตรวจสอบ",
      );
      onDone();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="ชำระเงิน" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        {qr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.qr}
              alt="QR PromptPay"
              className="border-border h-56 w-56 rounded-xl border"
            />
            <div>
              <p className="text-foreground text-2xl font-bold">
                {baht(qr.amount)}
              </p>
              {qr.promptPayName && (
                <p className="text-muted text-sm">{qr.promptPayName}</p>
              )}
              <p className="text-muted mt-1 text-xs">
                โอนตามยอดนี้เท่านั้น แล้วอัปโหลดสลิปด้านล่าง
              </p>
            </div>
          </>
        ) : (
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
        )}

        <label className="border-border hover:bg-background flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors">
          <Upload size={18} className="text-muted" />
          <span className="text-foreground/80 truncate">
            {file ? file.name : "เลือกรูปสลิป (JPG, PNG, WEBP)"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          onClick={submit}
          disabled={busy || !file || !qr}
          className="w-full cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "กำลังตรวจสอบสลิป..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>
    </Modal>
  );
}

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 100;
  const danger = max > 0 && used >= max;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className={danger ? "font-medium text-red-600" : "text-foreground"}>
          {used.toLocaleString("th-TH")} / {max.toLocaleString("th-TH")}
        </span>
      </div>
      <div className="bg-background h-2 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${danger ? "bg-red-500" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function OwnerBillingContainer() {
  const [billing, setBilling] = useState<MyBilling | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [dorms, setDorms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [payOrder, setPayOrder] = useState<BillingOrder | null>(null);

  const load = useCallback(async () => {
    try {
      const [b, p, o, d] = await Promise.all([
        BillingService.getMyBilling(),
        BillingService.getPlans(),
        BillingService.getOrders(),
        DormService.getDorm().catch(() => []),
      ]);
      setBilling(b);
      setPlans(p);
      setOrders(o);
      setDorms(
        (Array.isArray(d) ? d : []).map((x: any) => ({
          id: x.id,
          name: x.name,
        })),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claimTrial = async () => {
    try {
      await BillingService.claimTrial();
      toast.success("เริ่มทดลองใช้งานแล้ว");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await BillingService.cancelOrder(id);
      toast.success("ยกเลิกคำสั่งซื้อแล้ว");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCreated = (order: BillingOrder) => {
    setCheckout(null);
    if (order.status === "PENDING") {
      setPayOrder(order);
    } else {
      toast.success("เปิดใช้งานเรียบร้อย");
    }
    load();
  };

  if (loading || !billing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const status = STATUS_LABEL[billing.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Package size={24} />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            แพ็คเกจและการชำระเงิน
          </h1>
          <p className="text-muted mt-1 text-sm">
            จัดการแพ็คเกจ โควต้า และโปรโมทหอพักของคุณ
          </p>
        </div>
      </div>

      {(billing.status === "GRACE" || billing.status === "EXPIRED") && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <p>
            {billing.status === "GRACE"
              ? `แพ็คเกจหมดอายุแล้ว ใช้งานได้แบบอ่านอย่างเดียวถึง ${dateTh(billing.graceEndsAt)} กรุณาต่ออายุเพื่อเพิ่มหอ ห้อง หรือออกบิลใหม่`
              : "แพ็คเกจหมดอายุแล้ว ข้อมูลของคุณยังอยู่ครบ แต่เพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้จนกว่าจะต่ออายุ"}
          </p>
        </div>
      )}

      <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted text-sm">แพ็คเกจปัจจุบัน</p>
            <p className="text-foreground text-xl font-bold">
              {billing.plan.name}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${status.cls}`}
          >
            {status.text}
          </span>
        </div>
        {billing.periodEnd && (
          <p className="text-muted mt-2 flex items-center gap-1.5 text-sm">
            <Clock size={14} />
            {billing.status === "TRIAL" ? "ทดลองใช้ถึง" : "ใช้งานถึง"}{" "}
            {dateTh(billing.periodEnd)}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <UsageBar
            label="หอพัก"
            used={billing.usage.dorms}
            max={billing.plan.maxDorms}
          />
          <UsageBar
            label="ห้องพัก"
            used={billing.usage.rooms}
            max={billing.plan.maxRooms}
          />
          <UsageBar
            label="ตรวจสลิปเดือนนี้"
            used={billing.usage.slips}
            max={billing.plan.slipQuotaMonthly}
          />
        </div>

        {billing.trial.available && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <Gift size={20} />
              <span>
                ทดลองใช้แพ็คเกจ {billing.trial.planName} ฟรี {billing.trial.days}{" "}
                วัน ไม่ต้องชำระเงิน
              </span>
            </div>
            <button
              onClick={claimTrial}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
            >
              รับสิทธิ์ทดลองฟรี
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          เลือกแพ็คเกจ
        </h2>
        {plans.length === 0 ? (
          <p className="text-muted text-sm">ยังไม่มีแพ็คเกจที่เปิดขาย</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const current =
                billing.plan.id === plan.id && billing.status === "ACTIVE";
              return (
                <div
                  key={plan.id}
                  className={`bg-surface flex flex-col rounded-2xl border p-5 shadow-sm ${current ? "border-blue-500" : "border-border"}`}
                >
                  <h3 className="text-foreground text-lg font-bold">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-muted mt-1 text-sm">{plan.description}</p>
                  )}
                  <p className="text-foreground mt-4 text-3xl font-bold">
                    {baht(plan.priceMonthly)}
                    <span className="text-muted text-sm font-normal">
                      {" "}
                      / เดือน
                    </span>
                  </p>
                  <ul className="text-muted mt-4 flex-1 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {plan.maxDorms.toLocaleString("th-TH")} หอพัก
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {plan.maxRooms.toLocaleString("th-TH")} ห้องพัก
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      ตรวจสลิป {plan.slipQuotaMonthly.toLocaleString("th-TH")}{" "}
                      ครั้ง/เดือน
                    </li>
                  </ul>
                  <button
                    onClick={() => setCheckout({ kind: "PLAN", plan })}
                    className="mt-5 cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                  >
                    {current ? "ต่ออายุ" : "เลือกแพ็คเกจนี้"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                โปรโมทหอพัก
              </h2>
              <p className="text-muted text-sm">
                แสดงหอของคุณก่อนหอทั่วไป เริ่มต้น{" "}
                {baht(billing.promotion.pricePerMonth)} / เดือน (ว่าง{" "}
                {billing.promotion.slotsAvailable} จาก{" "}
                {billing.promotion.maxSlots} ช่อง)
              </p>
            </div>
          </div>
          <button
            onClick={() => setCheckout({ kind: "PROMOTION" })}
            disabled={billing.promotion.slotsAvailable <= 0}
            className="cursor-pointer rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {billing.promotion.slotsAvailable <= 0
              ? "ช่องเต็มแล้ว"
              : "โปรโมทหอพัก"}
          </button>
        </div>
        {billing.promotion.active.length > 0 && (
          <ul className="border-border divide-border mt-4 divide-y rounded-xl border text-sm">
            {billing.promotion.active.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-foreground font-medium">{p.dormName}</span>
                <span className="text-muted">โปรโมทถึง {dateTh(p.endsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          ประวัติคำสั่งซื้อ
        </h2>
        <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="text-muted w-full text-left text-sm">
              <thead className="border-border bg-background/50 border-b text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    วันที่
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    รายการ
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    ยอด
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    สถานะ
                  </th>
                  <th className="px-6 py-4 text-center font-semibold whitespace-nowrap">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      ยังไม่มีคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const st = ORDER_LABEL[o.status];
                    return (
                      <tr key={o.id} className="hover:bg-background/80">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dateTh(o.createdAt)}
                        </td>
                        <td className="text-foreground px-6 py-4 whitespace-nowrap">
                          {o.type === "PLAN"
                            ? `แพ็คเกจ ${o.plan?.name ?? ""}`
                            : `โปรโมท ${o.dorm?.name ?? ""}`}{" "}
                          <span className="text-muted">({o.months} เดือน)</span>
                        </td>
                        <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                          {baht(o.finalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${st.cls}`}
                          >
                            {st.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {o.status === "PENDING" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPayOrder(o)}
                                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                ชำระเงิน
                              </button>
                              <button
                                onClick={() => cancelOrder(o.id)}
                                className="text-muted cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-50 hover:text-red-600"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          )}
                          {o.status === "REJECTED" && o.note && (
                            <span className="text-xs text-red-600">{o.note}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {checkout && (
        <CheckoutModal
          checkout={checkout}
          billing={billing}
          dorms={dorms}
          onClose={() => setCheckout(null)}
          onCreated={handleCreated}
        />
      )}

      {payOrder && (
        <PayModal
          order={payOrder}
          onClose={() => setPayOrder(null)}
          onDone={() => {
            setPayOrder(null);
            load();
          }}
        />
      )}
    </div>
  );
}
