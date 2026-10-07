"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, Clock, Gift, X } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { BillingService } from "../../services/billing.service";
import { useOwnerBilling } from "../../context/OwnerBillingContext";

const DAY_MS = 24 * 60 * 60 * 1000;

type Notice =
  | { kind: "welcome" }
  | { kind: "expiring"; daysLeft: number; key: string }
  | { kind: "lapsed"; state: "GRACE" | "EXPIRED" };

const dateTh = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

// เข้าถึง storage ไม่ได้ (โหมดส่วนตัว/ถูกบล็อก) ต้องไม่ทำให้หน้าพัง
const safe = {
  getSession: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setSession: (k: string) => {
    try {
      sessionStorage.setItem(k, "1");
    } catch {}
  },
  getLocal: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setLocal: (k: string) => {
    try {
      localStorage.setItem(k, "1");
    } catch {}
  },
};

/**
 * modal แจ้งเตือนเรื่องแพ็คเกจตอนเข้าระบบ (ทำงานเฉพาะเมื่อแอดมินเปิดบังคับโควต้า)
 * - ต้อนรับ: เจ้าของหอใหม่ รับทดลองฟรีได้ในคลิกเดียว (ขึ้นครั้งเดียวต่อ session)
 * - ใกล้หมดอายุ: เหลือ 7/3/1 วัน ขึ้นครั้งเดียวต่อระดับ
 * - ผ่อนผัน/หมดอายุ: ขึ้นครั้งเดียวต่อ session จนกว่าจะต่ออายุ
 */
export default function OwnerBillingNotices() {
  const { billing, refresh } = useOwnerBilling();
  const [dismissed, setDismissed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const notice = useMemo<Notice | null>(() => {
    if (!mounted || !billing || !billing.enforced) return null;

    if (
      billing.status === "FREE" &&
      billing.trial.available &&
      !safe.getSession("rf-notice-welcome")
    ) {
      return { kind: "welcome" };
    }

    if (
      (billing.status === "TRIAL" || billing.status === "ACTIVE") &&
      billing.periodEnd
    ) {
      const daysLeft = Math.ceil(
        (new Date(billing.periodEnd).getTime() - Date.now()) / DAY_MS,
      );

      if (daysLeft >= 0 && daysLeft <= 7) {
        const level = daysLeft <= 1 ? 1 : daysLeft <= 3 ? 3 : 7;
        const key = `rf-notice-expiring:${billing.periodEnd}:${level}`;

        if (!safe.getLocal(key)) return { kind: "expiring", daysLeft, key };
      }
    }

    if (
      (billing.status === "GRACE" || billing.status === "EXPIRED") &&
      !safe.getSession("rf-notice-lapsed")
    ) {
      return { kind: "lapsed", state: billing.status };
    }

    return null;
  }, [billing, mounted]);

  const close = () => {
    if (notice?.kind === "welcome") safe.setSession("rf-notice-welcome");
    if (notice?.kind === "expiring") safe.setLocal(notice.key);
    if (notice?.kind === "lapsed") safe.setSession("rf-notice-lapsed");
    setDismissed(true);
  };

  useEffect(() => {
    if (!notice || dismissed) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice, dismissed]);

  if (!notice || dismissed || !billing) return null;

  const claimTrial = async () => {
    setClaiming(true);
    try {
      await BillingService.claimTrial();
      toast.success("เริ่มทดลองใช้งานแล้ว ใช้ได้ทุกฟีเจอร์ตามแพ็คเกจ");
      safe.setSession("rf-notice-welcome");
      setDismissed(true);
      await refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setClaiming(false);
    }
  };

  const renewHref = `/owner/billing?plan=${billing.plan.id}&months=12`;

  const content = (() => {
    if (notice.kind === "welcome") {
      const trial = billing.trial.available ? billing.trial : null;

      return {
        icon: <Gift className="h-8 w-8 text-emerald-600" />,
        iconBg: "bg-emerald-100",
        title: "ยินดีต้อนรับสู่ RentFlow",
        body: trial
          ? `ลงประกาศหอพักได้ฟรีตลอด และรับสิทธิ์ทดลองใช้ระบบจัดการหอพักเต็มรูปแบบฟรี ${trial.days} วัน (แพ็คเกจ ${trial.planName}) ได้ทันที ไม่ต้องชำระเงิน`
          : "",
        actions: (
          <>
            <button
              onClick={claimTrial}
              disabled={claiming}
              className="w-full cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claiming ? "กำลังเปิดใช้งาน..." : "รับทดลองฟรีเลย"}
            </button>
            <Link
              href="/owner/billing"
              onClick={close}
              className="border-border text-foreground/80 hover:bg-background block w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition-colors"
            >
              ดูแพ็คเกจทั้งหมด
            </Link>
          </>
        ),
      };
    }

    if (notice.kind === "expiring") {
      const isTrial = billing.status === "TRIAL";
      const when =
        notice.daysLeft <= 0 ? "วันนี้" : `ในอีก ${notice.daysLeft} วัน`;

      return {
        icon: <Clock className="h-8 w-8 text-amber-600" />,
        iconBg: "bg-amber-100",
        title: isTrial
          ? `ช่วงทดลองใช้จะสิ้นสุด${when}`
          : `แพ็คเกจจะหมดอายุ${when}`,
        body: `แพ็คเกจ ${billing.plan.name} ${isTrial ? "ทดลองใช้ถึง" : "ใช้งานได้ถึง"} ${dateTh(billing.periodEnd)} ต่ออายุก่อนหมดเพื่อให้ใช้งานต่อเนื่อง ข้อมูลของคุณจะไม่หาย แต่หลังหมดอายุจะเพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้`,
        actions: (
          <Link
            href={renewHref}
            onClick={close}
            className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {isTrial ? "เลือกแพ็คเกจใช้งานต่อ" : "ต่ออายุเลย"}
          </Link>
        ),
      };
    }

    return {
      icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
      iconBg: "bg-red-100",
      title: "แพ็คเกจหมดอายุแล้ว",
      body:
        notice.state === "GRACE"
          ? `ตอนนี้ใช้งานได้แบบอ่านอย่างเดียวถึง ${dateTh(billing.graceEndsAt)} ต่ออายุเพื่อกลับมาเพิ่มหอ ห้อง และออกบิลใหม่ได้ตามปกติ ข้อมูลของคุณยังอยู่ครบ`
          : "ข้อมูลของคุณยังอยู่ครบและเปิดดูได้ แต่เพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้จนกว่าจะต่ออายุ",
      actions: (
        <Link
          href={renewHref}
          onClick={close}
          className="block w-full rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
        >
          ต่ออายุเลย
        </Link>
      ),
    };
  })();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={close}
          aria-label="ปิด"
          className="text-muted hover:bg-background absolute top-4 right-4 cursor-pointer rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 rounded-full p-3 ${content.iconBg}`}>
            {content.icon}
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            {content.title}
          </h3>
          <p className="text-muted mb-6 text-sm leading-relaxed">
            {content.body}
          </p>
          <div className="flex w-full flex-col gap-2.5">
            {content.actions}
            <button
              onClick={close}
              className="text-muted hover:bg-background w-full cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors"
            >
              ไว้ทีหลัง
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
