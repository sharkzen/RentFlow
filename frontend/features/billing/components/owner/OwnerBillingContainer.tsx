"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  Megaphone,
  Lock,
  Package,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { BillingService } from "../../services/billing.service";
import DurationSwitch from "../shared/DurationSwitch";
import PlanPriceBlock from "../shared/PlanPriceBlock";
import {
  FEATURE_NAME_BY_KEY,
  featureHref,
  useOwnerBilling,
} from "../../context/OwnerBillingContext";
import TrialConfirmDialog from "./TrialConfirmDialog";
import {
  MONTH_LABEL,
  MONTH_OPTIONS,
  planPeriodPrice,
  planSavings,
} from "../../lib/pricing";
import type {
  BillingOrder,
  CouponPreview,
  MyBilling,
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

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

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
    REFUNDED: { text: "คืนเงินแล้ว", cls: "border-border bg-background text-muted" },
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
  | { kind: "PLAN"; plan: Plan; months?: number }
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
  // แพ็คเกจตั้งต้นที่รายปี (คุ้มสุด) ถ้ามาจากปุ่มต่ออายุจะใช้ระยะเวลาที่ส่งมา
  const [months, setMonths] = useState(
    checkout.kind === "PLAN" ? (checkout.months ?? 12) : 1,
  );
  const [dormId, setDormId] = useState(dorms[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [busy, setBusy] = useState(false);

  const unit =
    checkout.kind === "PLAN"
      ? checkout.plan.priceMonthly
      : billing.promotion.pricePerMonth;
  // ราคาปกติรายเดือนคูณจำนวนเดือน และราคาหลังหักส่วนลดตามระยะเวลา (แพ็คเกจเท่านั้น)
  const fullPrice = unit * months;
  const base =
    checkout.kind === "PLAN" ? planPeriodPrice(checkout.plan, months) : fullPrice;
  const termSavings = fullPrice - base;
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            หอที่โปรโมทจะแสดงก่อนหอทั่วไปและหอแนะนำในหน้าแรกและผลการค้นหา
            ลำดับตามเวลาที่ชำระเงินสำเร็จ ผู้ที่ชำระก่อนจะได้อันดับแรกๆ ก่อน
            ลำดับจะเริ่มนับเมื่อระบบยืนยันการชำระเงินแล้วเท่านั้น
          </div>
        )}

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
            {MONTH_OPTIONS.map((m) => {
              const save =
                checkout.kind === "PLAN" ? planSavings(checkout.plan, m) : 0;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => changeMonths(m)}
                  className={`relative cursor-pointer rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${months === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border text-muted hover:bg-background"}`}
                >
                  {m === 12 && checkout.kind === "PLAN" && save > 0 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold whitespace-nowrap text-white">
                      คุ้มสุด
                    </span>
                  )}
                  {MONTH_LABEL[m]}
                  {save > 0 && (
                    <span className="block text-[11px] font-normal text-emerald-600">
                      ประหยัด {baht(save)}
                    </span>
                  )}
                </button>
              );
            })}
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
            <span>{baht(fullPrice)}</span>
          </div>
          {termSavings > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>ส่วนลด{MONTH_LABEL[months]}</span>
              <span>-{baht(termSavings)}</span>
            </div>
          )}
          {shown.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>ส่วนลดจากโค้ด</span>
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
          {busy ? "กำลังดำเนินการ..." : "ไปหน้าชำระเงิน"}
        </button>
      </div>
    </Modal>
  );
}

function UsageBar({
  label,
  used,
  max,
  unlimited = false,
}: {
  label: string;
  used: number;
  max: number;
  unlimited?: boolean;
}) {
  if (unlimited) {
    return (
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="text-foreground">
            {used.toLocaleString("th-TH")} / ไม่จำกัด
          </span>
        </div>
        <div className="bg-background h-2 overflow-hidden rounded-full">
          <div className="h-full w-full rounded-full bg-emerald-500/60" />
        </div>
      </div>
    );
  }

  // แพ็คที่ไม่มีโควต้านี้ (เช่น แพ็คฟรีไม่รวมการตรวจสลิป) ไม่ต้องโชว์ "0 / 0" กับแถบเต็ม
  if (max <= 0) {
    return (
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="text-muted">ไม่รวมในแพ็คเกจ</span>
        </div>
        <div className="bg-background h-2 rounded-full" />
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / max) * 100));
  const danger = used >= max;

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
  // ตั้งต้นที่รายปี (คุ้มสุด)
  const [months, setMonths] = useState(12);
  const [orderToCancel, setOrderToCancel] = useState<BillingOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [trialConfirmOpen, setTrialConfirmOpen] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh: refreshBilling } = useOwnerBilling();
  const fromFeature = searchParams.get("from");
  const deepLinkHandled = React.useRef(false);

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

  // ลิงก์ลัด ?plan=<id>&months=<n> (ปุ่มต่ออายุ/อัปเกรดจาก modal) เปิดหน้าสรุปให้เลย
  useEffect(() => {
    if (deepLinkHandled.current || plans.length === 0) return;

    const planId = searchParams.get("plan");
    if (!planId) return;

    deepLinkHandled.current = true;
    const plan = plans.find((p) => p.id === planId);
    const months = Number(searchParams.get("months"));

    if (plan) {
      setCheckout({
        kind: "PLAN",
        plan,
        months: [1, 3, 6, 12].includes(months) ? months : undefined,
      });
    }
  }, [plans, searchParams]);

  // มาจากเมนูที่ถูกล็อก: เปิดสิทธิ์สำเร็จแล้วพากลับหน้านั้นเลย
  const goBackToFeature = () => {
    const href = featureHref(fromFeature);
    if (href) router.push(href);
  };

  const claimTrial = async () => {
    setClaimingTrial(true);
    try {
      await BillingService.claimTrial();
      toast.success("เริ่มทดลองใช้งานแล้ว");
      setTrialConfirmOpen(false);
      // รอสิทธิ์ใหม่โหลดก่อนค่อยพากลับ ไม่งั้นจะเห็นหน้าล็อกวาบหนึ่ง
      await refreshBilling();
      load();
      goBackToFeature();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setClaimingTrial(false);
    }
  };

  const cancelOrder = async () => {
    if (!orderToCancel) return;

    setCancelling(true);
    try {
      await BillingService.cancelOrder(orderToCancel.id);
      toast.success("ยกเลิกคำสั่งซื้อแล้ว");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCancelling(false);
      setOrderToCancel(null);
    }
  };

  const handleCreated = (order: BillingOrder) => {
    setCheckout(null);

    if (order.status === "PENDING") {
      router.push(
        `/owner/billing/checkout/${order.id}${fromFeature ? `?from=${encodeURIComponent(fromFeature)}` : ""}`,
      );
      return;
    }

    // คูปองลด 100% เปิดสิทธิ์ทันที ไม่ต้องโอนเงิน
    toast.success("เปิดใช้งานเรียบร้อย");
    load();
    refreshBilling().then(goBackToFeature);
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
            จัดการแพ็คเกจ โควต้า และโปรโมทหอพัก ของคุณ
          </p>
        </div>
      </div>

      {fromFeature && FEATURE_NAME_BY_KEY[fromFeature] && billing.access !== "full" && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Lock size={20} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">
              {FEATURE_NAME_BY_KEY[fromFeature]}
            </span>{" "}
            ต้องใช้แพ็คเกจ
            {billing.trial.available
              ? ` รับทดลองใช้ฟรี ${billing.trial.days} วันได้ด้านล่าง หรือเลือกแพ็คเกจที่ต้องการ`
              : " เลือกแพ็คเกจที่เหมาะกับคุณได้ด้านล่าง"}
          </p>
        </div>
      )}

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
              {billing.status === "FREE"
                ? "ยังไม่ได้สมัครแพ็คเกจ"
                : `แพ็คเกจ ${billing.plan.name}`}
            </p>
            {billing.status === "FREE" && (
              <p className="text-muted mt-0.5 text-sm">
                ลงประกาศหอพักได้ฟรี {billing.plan.maxDorms} หอ
                ส่วนเครื่องมือจัดการต้องมีแพ็คเกจ
              </p>
            )}
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
            {billing.status === "TRIAL"
              ? "ทดลองใช้ถึง"
              : billing.status === "GRACE" || billing.status === "EXPIRED"
                ? "หมดอายุเมื่อ"
                : "ใช้งานถึง"}{" "}
            {dateTh(billing.periodEnd)}
            {(billing.status === "TRIAL" || billing.status === "ACTIVE") &&
              ` (เหลืออีก ${daysLeft(billing.periodEnd)} วัน)`}
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
            unlimited={billing.plan.slipUnlimited}
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
              onClick={() => setTrialConfirmOpen(true)}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
            >
              รับสิทธิ์ทดลองฟรี
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-4 text-lg font-bold">
          เลือกแพ็คเกจ
        </h2>
        {plans.length === 0 ? (
          <p className="text-muted text-sm">ยังไม่มีแพ็คเกจที่เปิดขาย</p>
        ) : (
          <>
            <DurationSwitch
              value={months}
              onChange={setMonths}
              plans={plans}
              id="owner-billing"
            />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const current =
                  billing.plan.id === plan.id && billing.status === "ACTIVE";
                return (
                  <div
                    key={plan.id}
                    className={`bg-surface flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-lg ${current ? "border-blue-500 ring-1 ring-blue-500" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-foreground text-lg font-bold">
                        {plan.name}
                      </h3>
                      {current && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          แพ็คเกจปัจจุบัน
                        </span>
                      )}
                    </div>
                    <p className="text-muted mt-1 line-clamp-2 min-h-10 text-sm">
                      {plan.description}
                    </p>
                    <div className="mt-4">
                      <PlanPriceBlock plan={plan} months={months} />
                    </div>
                    <button
                      onClick={() => setCheckout({ kind: "PLAN", plan, months })}
                      className="mt-2 cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      {current ? "ต่ออายุ" : "เลือกแพ็คเกจนี้"}
                    </button>
                    <ul className="border-border mt-6 space-y-1.5 border-t pt-5 text-sm">
                      {[
                        { ok: true, text: `${plan.maxDorms.toLocaleString("th-TH")} หอพัก` },
                        { ok: true, text: `${plan.maxRooms.toLocaleString("th-TH")} ห้องพักรวม` },
                        {
                          ok: true,
                          text: plan.slipUnlimited
                            ? "ตรวจสลิปไม่จำกัด"
                            : `ตรวจสลิป ${plan.slipQuotaMonthly.toLocaleString("th-TH")} ครั้ง/เดือน`,
                        },
                        { ok: plan.hasOcr, text: "สแกนมิเตอร์ OCR" },
                      ].map((row) => (
                        <li
                          key={row.text}
                          className={`flex min-h-7 items-center gap-2.5 ${row.ok ? "text-foreground" : "text-muted/60"}`}
                        >
                          {row.ok ? (
                            <CheckCircle2
                              size={16}
                              className="shrink-0 text-emerald-500"
                            />
                          ) : (
                            <X size={16} className="shrink-0" />
                          )}
                          <span className={row.ok ? "" : "line-through decoration-1"}>
                            {row.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
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
                แสดงหอของคุณก่อนหอทั่วไปและหอแนะนำ เริ่มต้น{" "}
                {baht(billing.promotion.pricePerMonth)} / เดือน (ว่าง{" "}
                {billing.promotion.slotsAvailable} จาก{" "}
                {billing.promotion.maxSlots} ช่อง)
              </p>
              <p className="text-muted mt-0.5 text-xs">
                ผู้ที่ชำระเงินสำเร็จก่อนจะได้อันดับแรกๆ ก่อน
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
                                onClick={() =>
                                  router.push(`/owner/billing/checkout/${o.id}`)
                                }
                                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                ชำระเงิน
                              </button>
                              <button
                                onClick={() => setOrderToCancel(o)}
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

      {billing.trial.available && (
        <TrialConfirmDialog
          isOpen={trialConfirmOpen}
          trial={billing.trial}
          isLoading={claimingTrial}
          onClose={() => setTrialConfirmOpen(false)}
          onConfirm={claimTrial}
        />
      )}

      <ConfirmDialog
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={cancelOrder}
        isLoading={cancelling}
        type="warning"
        title="ยกเลิกคำสั่งซื้อนี้?"
        description="คำสั่งซื้อที่ยังไม่ชำระจะถูกยกเลิก หากโอนเงินไปแล้วกรุณาอย่ายกเลิก แต่เข้าไปแนบสลิปที่ปุ่มชำระเงิน"
        confirmText="ยกเลิกคำสั่งซื้อ"
        cancelText="กลับ"
      />

      {checkout && (
        <CheckoutModal
          checkout={checkout}
          billing={billing}
          dorms={dorms}
          onClose={() => setCheckout(null)}
          onCreated={handleCreated}
        />
      )}

    </div>
  );
}
