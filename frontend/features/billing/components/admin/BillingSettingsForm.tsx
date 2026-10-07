"use client";
import React, { useEffect, useState } from "react";
import {
  Settings,
  ShieldCheck,
  Gift,
  ScanLine,
  Clock,
  Landmark,
  Megaphone,
} from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { BankSelect } from "@/features/dormitory/components/DormPaymentSettings";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { BillingSettings, Plan } from "../../types";

const inputClass =
  "border-border w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none";

const labelClass = "text-foreground/80 mb-1.5 block text-sm font-medium";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
      <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
        <Icon size={18} className="text-blue-600" />
        {title}
      </h2>
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export default function BillingSettingsForm() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [granting, setGranting] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      AdminBillingService.getSettings(),
      AdminBillingService.getPlans(),
    ])
      .then(([s, p]) => {
        setSettings(s);
        setPlans(p);
      })
      .catch((error: any) =>
        toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดการตั้งค่าได้")),
      );
  }, []);

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const set = <K extends keyof BillingSettings>(
    key: K,
    value: BillingSettings[K],
  ) => setSettings({ ...settings, [key]: value });

  const num = (value: string) => (value === "" ? 0 : Number(value));

  const trialPlans = plans.filter((p) => !p.isFree && p.allowTrial);

  const handleGrantTrial = async () => {
    setGranting(true);
    try {
      const res = await AdminBillingService.grantTrialToExistingOwners();
      toast.success(
        res.granted > 0
          ? `แจกสิทธิ์ทดลองให้ ${res.granted} บัญชีแล้ว`
          : "ไม่มีเจ้าของหอที่ต้องแจกเพิ่ม",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGranting(false);
      setGrantOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.trialEnabled && !settings.trialPlanId) {
      toast.error("กรุณาเลือกแพ็คเกจสำหรับทดลองใช้ฟรี");
      return;
    }

    setSaving(true);
    try {
      const { slipUsage: _slipUsage, ...payload } = settings;
      setSettings(await AdminBillingService.updateSettings(payload));
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            ตั้งค่าการเงิน
          </h1>
          <p className="text-muted mt-1 text-sm">
            ทดลองใช้ฟรี ระยะผ่อนผัน บัญชีรับเงิน และโปรโมทหอ
          </p>
        </div>
      </div>

      <Section
        icon={ShieldCheck}
        title="บังคับใช้โควต้าแพ็คเกจ"
        hint="เมื่อเปิด เจ้าของหอที่ไม่มีแพ็คเกจจะถูกจำกัดตามแพ็คเกจฟรี และสร้างหอ/ห้องเกินโควต้าไม่ได้ ควรตั้งแพ็คเกจให้เรียบร้อยก่อนเปิด"
      >
        <div className="border-border bg-background flex items-center justify-between rounded-xl border p-4 sm:col-span-2">
          <span className="text-foreground text-sm font-medium">
            เปิดบังคับโควต้า
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enforceLimits}
            onClick={() => set("enforceLimits", !settings.enforceLimits)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${settings.enforceLimits ? "bg-blue-600" : "bg-muted"}`}
          >
            <span
              aria-hidden="true"
              className={`bg-surface pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${settings.enforceLimits ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div className="border-border bg-background rounded-xl border p-4 sm:col-span-2">
          <p className="text-foreground text-sm font-medium">
            เจ้าของหอที่ใช้งานอยู่ก่อนเปิดระบบเก็บเงิน
          </p>
          <p className="text-muted mt-1 text-xs">
            แจกทดลองฟรีให้เจ้าของหอที่อนุมัติแล้วและยังไม่มีแพ็คเกจ ตามแพ็คเกจและจำนวนวันที่ตั้งไว้ด้านล่าง
            ข้อมูลเดิมไม่สะดุด กดซ้ำได้โดยไม่แจกซ้ำ และข้ามบัญชีที่ถูกตัดสิทธิ์ทดลอง ควรกดก่อนเปิดบังคับโควต้า
          </p>
          <button
            type="button"
            onClick={() => setGrantOpen(true)}
            disabled={granting}
            className="mt-3 cursor-pointer rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {granting ? "กำลังแจกสิทธิ์..." : "แจกทดลองฟรีให้เจ้าของหอเดิมทุกคน"}
          </button>
        </div>
      </Section>

      <Section
        icon={Gift}
        title="ทดลองใช้ฟรี"
        hint="เจ้าของหอกดรับสิทธิ์ทดลองได้ครั้งเดียวต่อบัญชี"
      >
        <div className="border-border bg-background flex items-center justify-between rounded-xl border p-4 sm:col-span-2">
          <span className="text-foreground text-sm font-medium">
            เปิดให้ทดลองใช้ฟรี
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.trialEnabled}
            onClick={() => set("trialEnabled", !settings.trialEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${settings.trialEnabled ? "bg-blue-600" : "bg-muted"}`}
          >
            <span
              aria-hidden="true"
              className={`bg-surface pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${settings.trialEnabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div>
          <label className={labelClass}>แพ็คเกจที่ให้ทดลอง</label>
          <select
            value={settings.trialPlanId ?? ""}
            onChange={(e) => set("trialPlanId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">-- เลือกแพ็คเกจ --</option>
            {trialPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>ระยะเวลาทดลอง (วัน)</label>
          <input
            type="number"
            min={1}
            max={365}
            step={1}
            value={settings.trialDays}
            onChange={(e) => set("trialDays", num(e.target.value))}
            className={inputClass}
          />
        </div>
      </Section>

      <Section
        icon={ScanLine}
        title="โควต้า SlipOK ของแพลตฟอร์ม"
        hint="ยอดตรวจสลิปรวมทุกเจ้าของหอในเดือนนี้ เทียบกับแพ็ค SlipOK ที่ซื้อไว้ ระบบจะเตือนใน log เมื่อใช้ถึง 80%"
      >
        <div>
          <label className={labelClass}>โควต้าที่ซื้อไว้ต่อเดือน (สลิป)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={settings.slipOkPlatformQuota}
            onChange={(e) => set("slipOkPlatformQuota", num(e.target.value))}
            className={inputClass}
            placeholder="0 = ไม่ได้ตั้ง"
          />
        </div>
        {settings.slipUsage && (
          <div className="border-border bg-background rounded-xl border p-4">
            <p className="text-muted text-sm">
              ใช้ไปแล้วเดือน {settings.slipUsage.period}
            </p>
            <p className="text-foreground text-xl font-bold">
              {settings.slipUsage.total.toLocaleString("th-TH")}
              {settings.slipUsage.quota > 0 && (
                <span className="text-muted text-sm font-normal">
                  {" "}
                  / {settings.slipUsage.quota.toLocaleString("th-TH")} (
                  {settings.slipUsage.percent}%)
                </span>
              )}
            </p>
          </div>
        )}
      </Section>

      <Section
        icon={Clock}
        title="แพ็คเกจหมดอายุ"
        hint="หลังหมดอายุจะอ่านอย่างเดียวจนครบวันผ่อนผัน"
      >
        <div>
          <label className={labelClass}>ระยะผ่อนผัน (วัน)</label>
          <input
            type="number"
            min={0}
            max={90}
            step={1}
            value={settings.graceDays}
            onChange={(e) => set("graceDays", num(e.target.value))}
            className={inputClass}
          />
        </div>
      </Section>

      <Section
        icon={Landmark}
        title="บัญชีรับเงินค่าแพ็คเกจ"
        hint="เจ้าของหอจะเห็นบัญชีเหล่านี้ในหน้าชำระเงิน และระบบใช้เทียบกับผู้รับในสลิป ตั้งอย่างน้อยพร้อมเพย์หรือบัญชีธนาคารอย่างใดอย่างหนึ่ง"
      >
        <div>
          <label className={labelClass}>เลข PromptPay</label>
          <input
            type="text"
            value={settings.promptPayId}
            onChange={(e) => set("promptPayId", e.target.value)}
            className={inputClass}
            placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
          />
        </div>
        <div>
          <label className={labelClass}>ชื่อบัญชีพร้อมเพย์</label>
          <input
            type="text"
            value={settings.promptPayName}
            onChange={(e) => set("promptPayName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="relative z-20">
          <label className={labelClass}>ธนาคาร</label>
          <BankSelect
            value={settings.bankName}
            onChange={(val) => set("bankName", val)}
          />
        </div>
        <div>
          <label className={labelClass}>เลขที่บัญชี</label>
          <input
            type="text"
            inputMode="numeric"
            value={settings.bankAccountNumber}
            onChange={(e) =>
              set("bankAccountNumber", e.target.value.replace(/[^0-9-]/g, ""))
            }
            className={`${inputClass} font-mono`}
            placeholder="123-4-56789-0"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>ชื่อบัญชีธนาคาร</label>
          <input
            type="text"
            value={settings.bankAccountName}
            onChange={(e) => set("bankAccountName", e.target.value)}
            className={inputClass}
          />
        </div>
      </Section>

      <Section
        icon={Megaphone}
        title="โปรโมทหอ"
        hint="ใครชำระก่อนจะแสดงก่อน เมื่อช่องเต็มต้องรอจนมีหอหมดเวลา"
      >
        <div>
          <label className={labelClass}>ราคา/เดือน (บาท)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={settings.promoPricePerMonth}
            onChange={(e) => set("promoPricePerMonth", num(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>จำนวนช่องสูงสุดพร้อมกัน</label>
          <input
            type="number"
            min={0}
            step={1}
            value={settings.promoMaxSlots}
            onChange={(e) => set("promoMaxSlots", num(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>จองช่องระหว่างรอชำระ (นาที)</label>
          <input
            type="number"
            min={5}
            max={1440}
            step={1}
            value={settings.promoHoldMinutes}
            onChange={(e) => set("promoHoldMinutes", num(e.target.value))}
            className={inputClass}
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>
      <ConfirmDialog
        isOpen={grantOpen}
        onClose={() => setGrantOpen(false)}
        onConfirm={handleGrantTrial}
        isLoading={granting}
        type="info"
        title="แจกทดลองฟรีให้เจ้าของหอเดิม?"
        description="ระบบจะแจกสิทธิ์ทดลองให้เจ้าของหอที่อนุมัติแล้วและยังไม่มีแพ็คเกจทุกคน ตามแพ็คเกจและจำนวนวันที่บันทึกไว้ล่าสุด (บัญชีที่ถูกตัดสิทธิ์ทดลองจะถูกข้าม)"
        confirmText="แจกสิทธิ์ทดลอง"
      />
    </form>
  );
}
