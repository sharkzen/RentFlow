"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { FeatureService } from "@/features/feature/services/feature.service";
import type { Feature } from "@/features/feature/services";

export default function FeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    enabled: false,
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);

  const fetchFeatures = async () => {
    setLoading(true);

    try {
      const res = await FeatureService.getAllFeatures();

      if (res.data) setFeatures(res.data as unknown as Feature[]);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error.message || "ไม่สามารถโหลดข้อมูลฟีเจอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("create");

    setFormData({
      key: "",
      name: "",
      description: "",
      enabled: false,
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (feature: Feature) => {
    setModalMode("edit");
    setEditingKey(feature.key);

    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || "",
      enabled: feature.enabled,
    });

    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (key: string) => {
    setFeatureToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await FeatureService.createFeature(formData);
        toast.success("เพิ่มฟีเจอร์สำเร็จ");
      } else if (modalMode === "edit" && editingKey) {
        await FeatureService.updateFeature(editingKey, {
          name: formData.name,
          description: formData.description,
          enabled: formData.enabled,
        });

        toast.success("อัปเดตข้อมูลฟีเจอร์สำเร็จ");
      }

      setIsModalOpen(false);
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!featureToDelete) return;

    try {
      await FeatureService.deleteFeature(featureToDelete);
      toast.success("ลบฟีเจอร์สำเร็จ");
      setIsDeleteModalOpen(false);
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              จัดการฟีเจอร์ (Features)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              เปิด/ปิด และจัดการการตั้งค่าฟีเจอร์ต่างๆ ภายในระบบ
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 sm:w-auto"
        >
          <Plus size={18} />
          เพิ่มฟีเจอร์ใหม่
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อฟีเจอร์ หรือ Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  ชื่อฟีเจอร์
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  คีย์ (Key)
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  สถานะ
                </th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  คำอธิบาย
                </th>
                <th className="px-6 py-4 text-center font-semibold whitespace-nowrap">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFeatures.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    ไม่พบข้อมูลฟีเจอร์ที่คุณค้นหา
                  </td>
                </tr>
              ) : (
                filteredFeatures.map((feature) => (
                  <tr
                    key={feature.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                        {feature.key}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${feature.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${feature.enabled ? "bg-emerald-500" : "bg-slate-400"}`}
                        ></span>
                        {feature.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-slate-500 sm:max-w-xs">
                      {feature.description || (
                        <span className="text-slate-300 italic">
                          ไม่มีคำอธิบาย
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(feature)}
                          className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="แก้ไข"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(feature.key)}
                          className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
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
        <div className="flex items-center justify-between border-t border-slate-200 bg-white p-4 text-sm text-slate-500">
          <span>หน้า 1 จาก 1</span>
          <div className="flex gap-2">
            <button
              className="cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              disabled
            >
              ก่อนหน้า
            </button>
            <button
              className="cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              disabled
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "เพิ่มฟีเจอร์ใหม่" : "แก้ไขฟีเจอร์"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  คีย์ (Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={modalMode === "edit"}
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      key: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="เช่น OCR_BILL, PAYMENT_GW"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ชื่อฟีเจอร์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                  placeholder="เช่น ระบบสแกนบิล OCR"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  คำอธิบาย
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                  placeholder="รายละเอียดเพิ่มเติมของฟีเจอร์นี้..."
                />
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">
                    เปิดใช้งานฟีเจอร์
                  </span>
                  <span className="text-xs text-slate-500">
                    กำหนดสถานะพร้อมใช้งานทันที
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      enabled: !formData.enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${formData.enabled ? "bg-blue-600" : "bg-slate-300"}`}
                  role="switch"
                  aria-checked={formData.enabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.enabled ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity">
          <div className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl transition-all">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-red-50/50 bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              ยืนยันการลบฟีเจอร์?
            </h3>
            <p className="mb-8 text-sm text-slate-500">
              คุณกำลังจะลบฟีเจอร์รหัส <br />
              <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-800">
                {featureToDelete}
              </span>
              <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow active:scale-95"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
