"use client";
import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { BillingSettings, Plan } from "../../types";

const inputClass =
  "border-border w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none";

const labelClass = "text-foreground/80 mb-1.5 block text-sm font-medium";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
      <h2 className="text-foreground text-base font-bold">{title}</h2>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.trialEnabled && !settings.trialPlanId) {
      toast.error("กรุณาเลือกแพ็คเกจสำหรับทดลองใช้ฟรี");
      return;
    }

    setSaving(true);
    try {
      setSettings(await AdminBillingService.updateSettings(settings));
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
      </Section>

      <Section
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
        title="บัญชีรับเงิน (PromptPay)"
        hint="ใช้เทียบกับสลิปที่เจ้าของหอโอนชำระแพ็คเกจ"
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
          <label className={labelClass}>ชื่อบัญชี</label>
          <input
            type="text"
            value={settings.promptPayName}
            onChange={(e) => set("promptPayName", e.target.value)}
            className={inputClass}
          />
        </div>
      </Section>

      <Section
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
    </form>
  );
}
