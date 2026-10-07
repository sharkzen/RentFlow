"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Edit3, Package, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/backendError";
import { AdminBillingService } from "../../services/admin-billing.service";
import type { Plan, PlanPayload } from "../../types";

const emptyForm: PlanPayload = {
  name: "",
  description: "",
  priceMonthly: 0,
  maxDorms: 1,
  maxRooms: 12,
  slipQuotaMonthly: 0,
  slipOverageRate: null,
  allowTrial: true,
  isFree: false,
  isActive: true,
  sortOrder: 0,
};

const inputClass =
  "border-border w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none";

const fmt = (n: number) => n.toLocaleString("th-TH");

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${checked ? "bg-blue-600" : "bg-muted"}`}
    >
      <span
        aria-hidden="true"
        className={`bg-surface pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await AdminBillingService.getPlans());
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ไม่สามารถโหลดข้อมูลแพ็คเกจได้"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: plans.length });
    setIsModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    const { id, _count, ...rest } = plan;
    setEditingId(id);
    setForm(rest);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: PlanPayload = {
      ...form,
      description: form.description?.trim() || null,
    };

    try {
      if (editingId) {
        await AdminBillingService.updatePlan(editingId, payload);
        toast.success("อัปเดตแพ็คเกจสำเร็จ");
      } else {
        await AdminBillingService.createPlan(payload);
        toast.success("สร้างแพ็คเกจสำเร็จ");
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    try {
      const res = await AdminBillingService.deletePlan(planToDelete.id);
      toast.success(
        res.deactivated
          ? "แพ็คเกจนี้มีผู้ใช้งานอยู่ จึงปิดการใช้งานแทนการลบ"
          : "ลบแพ็คเกจสำเร็จ",
      );
      setPlanToDelete(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "เกิดข้อผิดพลาดในการลบข้อมูล"));
    }
  };

  const num = (value: string) => (value === "" ? 0 : Number(value));

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              แพ็คเกจ (Plans)
            </h1>
            <p className="text-muted mt-1 text-sm">
              กำหนดราคา จำนวนหอ จำนวนห้อง และโควต้าตรวจสลิปต่อเดือน
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 sm:w-auto"
        >
          <Plus size={18} />
          เพิ่มแพ็คเกจ
        </button>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted w-full text-left text-sm">
            <thead className="border-border bg-background/50 text-muted border-b text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  แพ็คเกจ
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  ราคา/เดือน
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  หอ
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  ห้อง
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  สลิป/เดือน
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  ผู้ใช้
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    ยังไม่มีแพ็คเกจ
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-background/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-foreground flex items-center gap-2 font-medium">
                        {plan.name}
                        {plan.isFree && (
                          <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            ฟรี
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <div className="text-muted max-w-[220px] truncate text-xs">
                          {plan.description}
                        </div>
                      )}
                    </td>
                    <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                      {fmt(plan.priceMonthly)} ฿
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fmt(plan.maxDorms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fmt(plan.maxRooms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fmt(plan.slipQuotaMonthly)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plan._count?.subscriptions ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${plan.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-background text-muted"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${plan.isActive ? "bg-emerald-500" : "bg-muted"}`}
                        ></span>
                        {plan.isActive ? "เปิดขาย" : "ปิดขาย"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(plan)}
                          className="text-muted cursor-pointer rounded-lg p-2 transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="แก้ไข"
                        >
                          <Edit3 size={18} />
                        </button>
                        {!plan.isFree && (
                          <button
                            onClick={() => setPlanToDelete(plan)}
                            className="text-muted cursor-pointer rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-600"
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="bg-surface my-auto w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-foreground text-lg font-bold">
                {editingId ? "แก้ไขแพ็คเกจ" : "เพิ่มแพ็คเกจ"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:bg-background hover:text-foreground cursor-pointer rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
              <div>
                <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                  ชื่อแพ็คเกจ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="เช่น START"
                />
              </div>
              <div>
                <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                  คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    ราคา/เดือน (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={form.priceMonthly}
                    onChange={(e) =>
                      setForm({ ...form, priceMonthly: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    ลำดับแสดงผล
                  </label>
                  <input
                    type="number"
                    step={1}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    จำนวนหอสูงสุด
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.maxDorms}
                    onChange={(e) =>
                      setForm({ ...form, maxDorms: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    จำนวนห้องรวมสูงสุด
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.maxRooms}
                    onChange={(e) =>
                      setForm({ ...form, maxRooms: num(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    โควต้าสลิป/เดือน
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.slipQuotaMonthly}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slipQuotaMonthly: num(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground/80 mb-1.5 block text-sm font-medium">
                    ค่าสลิปเกินโควต้า (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.slipOverageRate ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slipOverageRate:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className={inputClass}
                    placeholder="เว้นว่าง = ไม่ให้เกิน"
                  />
                </div>
              </div>

              <div className="border-border bg-background divide-border divide-y rounded-xl border">
                <div className="flex items-center justify-between p-4">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      เปิดขาย
                    </span>
                    <span className="text-muted text-xs">
                      เจ้าของหอเลือกซื้อแพ็คเกจนี้ได้
                    </span>
                  </div>
                  <Toggle
                    checked={form.isActive}
                    onChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      ให้ทดลองใช้ฟรี
                    </span>
                    <span className="text-muted text-xs">
                      เลือกเป็นแพ็คทดลองได้ที่หน้าตั้งค่า
                    </span>
                  </div>
                  <Toggle
                    checked={form.allowTrial}
                    onChange={(v) => setForm({ ...form, allowTrial: v })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:bg-background cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-surface w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-red-50/50 bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-bold">
              ยืนยันการลบแพ็คเกจ?
            </h3>
            <p className="text-muted mb-8 text-sm">
              แพ็คเกจ{" "}
              <span className="text-foreground font-bold">
                {planToDelete.name}
              </span>
              <br />
              หากมีผู้ใช้งานอยู่ ระบบจะปิดการขายแทนการลบ
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPlanToDelete(null)}
                className="border-border bg-surface text-foreground/80 hover:bg-background flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 active:scale-95"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
