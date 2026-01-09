"use client";
import { Dormitory } from "@/features/dormitory";
import { descriptionJsonToText, parseDescription } from "@/lib/text";

import {
  X,
  MapPin,
  Info,
  DollarSign,
  Zap,
  Droplets,
  Calendar,
  AlertCircle,
  Home,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { DormFormData } from "@/features/dormitory";
import ImageSection from "./ImageSection";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { RemoveScroll } from "react-remove-scroll";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendErrorMsg";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Link from "next/link";

interface DormsDialogProps {
  dorm: Dormitory;
  onClose: () => void;
  onEdit?: () => void;
}

const Label = ({ icon: Icon, children, required }: any) => (
  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
    {Icon && <Icon size={16} className="text-slate-400" />}
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none ${className}`}
    {...props}
  />
);

export default function DormsDialog({
  dorm,
  onClose,
  onEdit,
}: DormsDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useHotkeys("esc", () => {
    if (!isDeleteDialogOpen) onClose();
  });

  const closeRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(closeRef, () => {
    if (!isDeleteDialogOpen) {
      onClose();
    }
  });

  const [initialData, setInitialData] = useState<DormFormData | null>(null);
  const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  const [formData, setFormData] = useState<DormFormData>({
    id: dorm.id,
    name: dorm.name ?? "",
    description: descriptionJsonToText(dorm.description),
    address: dorm.address ?? "",
    mapUrl: dorm.mapUrl ?? "",
    roomPrice: dorm.settings?.roomPrice ?? 0,
    waterRate: dorm.settings?.waterRate ?? 0,
    electricRate: dorm.settings?.electricRate ?? 0,
    commonFee: dorm.settings?.commonFee ?? 0,
    lateFee: dorm.settings?.lateFee ?? 0,
    dueDay: dorm.settings?.dueDay ?? 1,
    dueMonthOffset: dorm.settings?.dueMonthOffset ?? 1,
  });

  useEffect(() => {
    setInitialData({
      ...formData,
    });
  }, []);

  const updateField = useCallback((field: keyof DormFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = async () => {
    if (initialData && isEqual(initialData, formData)) {
      onClose();
      return;
    }

    const payload: DormFormData = {
      ...formData,
      description: parseDescription(formData.description),
    };

    try {
      await toast.promise(DormService.updateDorm(payload), {
        pending: "กําลังบันทึกข้อมูล...",
        success: "บันทึกข้อมูลเรียบร้อย",
        error: "เกิดข้อผิดพลาดในการบันทึก",
      });

      onEdit?.();
      onClose();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await toast.promise(DormService.deleteDorm(dorm.id), {
        pending: "กําลังลบหอพัก...",
        success: "ลบหอพักเรียบร้อย",

        error: {
          render({ data }: any) {
            const errorData = data?.response?.data;
            const errorCode = errorData?.code;
            log.error("Delete Error:", errorData);

            if (errorCode === "DORM_HAS_DEPENDENCIES") {
              return "ไม่สามารถลบได้: เนื่องจากยังมีห้องพักหรือผู้เช่าอยู่ในระบบ";
            }

            if (errorCode === "FORBIDDEN_ACCESS") {
              return "คุณไม่มีสิทธิ์ลบหอพักนี้";
            }

            if (errorCode === "DORM_NOT_FOUND") {
              return "ไม่พบข้อมูลหอพัก อาจถูกลบไปแล้ว";
            }

            return errorData?.message || "เกิดข้อผิดพลาดในการลบหอพัก";
          },
        },
      });

      onEdit?.();
      onClose();
    } catch (error: any) {
      log.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  return (
    <RemoveScroll>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div
          ref={closeRef}
          className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-800">
                แก้ไขข้อมูลหอพัก
              </h2>
              <Link
                href={`/dorms/${dorm.slug}`}
                target="_blank"
                className="text-sm text-blue-500 underline"
              >
                ดูห้องพัก
              </Link>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <form
              className="space-y-6 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                  <Home size={16} />
                  ข้อมูลพื้นฐาน
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label required>ชื่อหอพัก</Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="เช่น หอพักสุขใจ เรสซิเดนซ์"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label required icon={DollarSign}>
                      ราคาห้องเช่า (เริ่มต้น)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.roomPrice}
                        onChange={(e) =>
                          updateField("roomPrice", e.target.value)
                        }
                        className="pl-9"
                      />
                      <span className="absolute top-2.5 left-3 text-slate-400">
                        ฿
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label required>คำอธิบาย</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      rows={4}
                      className="h-80 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                      placeholder="รายละเอียดเกี่ยวกับหอพัก สิ่งอำนวยความสะดวก..."
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                  <MapPin size={16} />
                  ที่ตั้งและแผนที่
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <Label required>ที่อยู่</Label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="เลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด"
                    />
                  </div>
                  <div>
                    <Label required>ลิงก์ Google Maps</Label>
                    <Input
                      type="url"
                      value={formData.mapUrl}
                      onChange={(e) => updateField("mapUrl", e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      คัดลอกลิงก์จาก Google Maps มาวางเพื่อแสดงแผนที่
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                  <Zap size={16} />
                  ค่าสาธารณูปโภค & ค่าธรรมเนียม
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <Label required icon={Zap}>
                      ค่าไฟ (บาท/หน่วย)
                    </Label>
                    <Input
                      min="0"
                      type="number"
                      value={formData.electricRate}
                      onChange={(e) =>
                        updateField("electricRate", parseFloat(e.target.value))
                      }
                      step="1"
                    />
                  </div>
                  <div>
                    <Label required icon={Droplets}>
                      ค่าน้ำ (บาท/หน่วย)
                    </Label>
                    <Input
                      min="0"
                      type="number"
                      value={formData.waterRate}
                      onChange={(e) =>
                        updateField("waterRate", parseFloat(e.target.value))
                      }
                      step="1"
                    />
                  </div>
                  <div>
                    <Label icon={Info}>ส่วนกลาง (บาท/เดือน)</Label>
                    <Input
                      min="0"
                      type="number"
                      value={formData.commonFee}
                      onChange={(e) =>
                        updateField("commonFee", parseFloat(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                  <Calendar size={16} />
                  รอบบิลและการชำระเงิน
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label required icon={Calendar}>
                      ชำระไม่เกินวันที่
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">วันที่</span>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={formData.dueDay}
                        onChange={(e) =>
                          updateField("dueDay", parseFloat(e.target.value))
                        }
                        className="text-center"
                      />
                      <span className="text-sm text-slate-500">ของเดือน</span>
                    </div>
                  </div>
                  <div>
                    <Label icon={AlertCircle}>ค่าปรับล่าช้า (บาท/วัน)</Label>
                    <Input
                      min="0"
                      type="number"
                      value={formData.lateFee}
                      onChange={(e) =>
                        updateField("lateFee", parseFloat(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label icon={Info}>รอบการชำระ</Label>
                    <select
                      value={formData.dueMonthOffset}
                      onChange={(e) =>
                        updateField("dueMonthOffset", parseInt(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value={0}>ชำระภายในเดือนที่ออกบิล</option>
                      <option value={1}>ชำระเดือนถัดไป</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                  <CheckCircle2 size={16} />
                  รูปภาพหอพัก
                </h3>
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <ImageSection dormId={dorm.id} />
                </div>
              </div>
            </form>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 max-sm:text-xs"
            >
              <Trash2 size={18} className="transition group-hover:scale-110" />
              <span>ลบหอพัก</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 focus:outline-none max-sm:text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none max-sm:text-xs"
              >
                <Save size={18} />
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="ต้องการลบหอพักนี้?"
          description={`คุณแน่ใจหรือไม่ที่จะลบข้อมูล "${formData.name}" การดำเนินการนี้ไม่สามารถเรียกคืนข้อมูลกลับมาได้`}
          type="error"
          confirmText="ยืนยันลบ"
          cancelText="ไม่, เก็บไว้"
          isLoading={isDeleting}
        />
      </div>
    </RemoveScroll>
  );
}
