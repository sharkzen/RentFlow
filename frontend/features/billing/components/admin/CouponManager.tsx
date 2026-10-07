"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { Coupon, CouponPayload, Plan } from "../../types";

const emptyForm: CouponPayload = {
  code: "",
  description: "",
  type: "PERCENT",
  value: 10,
  appliesTo: "BOTH",
  planIds: [],
  startsAt: null,
  endsAt: null,
  maxRedemptions: null,
  perOwnerLimit: 1,
  isActive: true,
};

const SCOPE_LABEL = { PLAN: "แพ็คเกจ", PROMOTION: "โปรโมทหอ", BOTH: "ทั้งหมด" };

const inputClass =
  "border-border w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none";
const labelClass = "text-foreground/80 mb-1.5 block text-sm font-medium";

/** แปลง ISO <-> ค่าของ input datetime-local (เวลาท้องถิ่นของเบราว์เซอร์) */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const describe = (c: Coupon) =>
  c.type === "PERCENT"
    ? `ลด ${c.value}%`
    : `ลด ${c.value.toLocaleString("th-TH")} ฿`;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("th-TH") : "ไม่กำหนด";

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponPayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        AdminBillingService.getCoupons(),
        AdminBillingService.getPlans(),
      ]);
      setCoupons(c);
      setPlans(p.filter((x) => !x.isFree));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดข้อมูลคูปองได้"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (c: Coupon) => {
    const { id, _count, ...rest } = c;
    setEditingId(id);
    setForm(rest);
    setIsOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: CouponPayload = {
      ...form,
      description: form.description?.trim() || null,
      // คูปองที่ผูกกับแพ็คเกจใช้ได้เฉพาะสินค้าแพ็คเกจ
      planIds: form.appliesTo === "PROMOTION" ? [] : form.planIds,
    };

    try {
      if (editingId) {
        await AdminBillingService.updateCoupon(editingId, payload);
        toast.success("อัปเดตคูปองสำเร็จ");
      } else {
        await AdminBillingService.createCoupon(payload);
        toast.success("สร้างคูปองสำเร็จ");
      }
      setIsOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!window.confirm(`ลบคูปอง ${c.code}?`)) return;
    try {
      const res = await AdminBillingService.deleteCoupon(c.id);
      toast.success(
        res.deactivated
          ? "คูปองนี้เคยถูกใช้แล้ว จึงปิดการใช้งานแทนการลบ"
          : "ลบคูปองสำเร็จ",
      );
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "เกิดข้อผิดพลาดในการลบข้อมูล"));
    }
  };

  const num = (v: string) => (v === "" ? 0 : Number(v));

  const togglePlan = (id: string) =>
    setForm((f) => ({
      ...f,
      planIds: f.planIds.includes(id)
        ? f.planIds.filter((x) => x !== id)
        : [...f.planIds, id],
    }));

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              คูปองและโปรโมชั่น
            </h1>
            <p className="text-muted mt-1 text-sm">
              สร้างโค้ดส่วนลดเป็นเปอร์เซ็นต์หรือจำนวนเงิน กำหนดช่วงเวลาและสิทธิ์
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
        >
          <Plus size={18} />
          สร้างคูปอง
        </button>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted w-full text-left text-sm">
            <thead className="border-border bg-background/50 border-b text-xs uppercase">
              <tr>
                {["โค้ด", "ส่วนลด", "ใช้กับ", "ช่วงเวลา", "ใช้แล้ว", "สถานะ", "จัดการ"].map(
                  (h) => (
                    <th
                      key={h}
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    ยังไม่มีคูปอง
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-background/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="border-border bg-background text-foreground rounded-md border px-2.5 py-1 font-mono text-xs font-medium">
                        {c.code}
                      </span>
                    </td>
                    <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                      {describe(c)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {SCOPE_LABEL[c.appliesTo]}
                      {c.planIds.length > 0 && (
                        <span className="text-muted text-xs">
                          {" "}
                          ({c.planIds.length} แพ็ค)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {fmtDate(c.startsAt)} - {fmtDate(c.endsAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c._count?.redemptions ?? 0}
                      {c.maxRedemptions !== null && ` / ${c.maxRedemptions}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${c.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-background text-muted"}`}
                      >
                        {c.isActive ? "เปิดใช้" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-muted cursor-pointer rounded-lg p-2 hover:bg-blue-50 hover:text-blue-600"
                          title="แก้ไข"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => remove(c)}
                          className="text-muted cursor-pointer rounded-lg p-2 hover:bg-red-50 hover:text-red-600"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="bg-surface my-auto w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-foreground text-lg font-bold">
                {editingId ? "แก้ไขคูปอง" : "สร้างคูปอง"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:bg-background cursor-pointer rounded-full p-2"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-5 p-6">
              <div>
                <label className={labelClass}>
                  โค้ด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} font-mono`}
                  placeholder="เช่น WELCOME50"
                />
              </div>
              <div>
                <label className={labelClass}>คำอธิบาย</label>
                <input
                  type="text"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>ประเภทส่วนลด</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as CouponPayload["type"],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="PERCENT">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงิน (บาท)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {form.type === "PERCENT" ? "ลดกี่ %" : "ลดกี่บาท"}
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    max={form.type === "PERCENT" ? 100 : undefined}
                    step="any"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>ใช้กับสินค้า</label>
                  <select
                    value={form.appliesTo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        appliesTo: e.target.value as CouponPayload["appliesTo"],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="BOTH">แพ็คเกจและโปรโมทหอ</option>
                    <option value="PLAN">เฉพาะแพ็คเกจ</option>
                    <option value="PROMOTION">เฉพาะโปรโมทหอ</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>ใช้ได้ต่อเจ้าของ (ครั้ง)</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.perOwnerLimit}
                    onChange={(e) =>
                      setForm({ ...form, perOwnerLimit: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>เริ่มใช้ได้</label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.startsAt)}
                    onChange={(e) =>
                      setForm({ ...form, startsAt: fromLocalInput(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>หมดอายุ</label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.endsAt)}
                    onChange={(e) =>
                      setForm({ ...form, endsAt: fromLocalInput(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>จำกัดจำนวนครั้งรวม</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.maxRedemptions ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxRedemptions:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className={inputClass}
                    placeholder="เว้นว่าง = ไม่จำกัด"
                  />
                </div>
              </div>

              {form.appliesTo !== "PROMOTION" && plans.length > 0 && (
                <div>
                  <label className={labelClass}>
                    จำกัดเฉพาะแพ็คเกจ (ไม่เลือก = ทุกแพ็คเกจ)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {plans.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlan(p.id)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${form.planIds.includes(p.id) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border text-muted hover:bg-background"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="border-border bg-background flex cursor-pointer items-center justify-between rounded-xl border p-4">
                <span className="text-foreground text-sm font-medium">
                  เปิดใช้งานคูปอง
                </span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 cursor-pointer"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-muted hover:bg-background cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
