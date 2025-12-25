import { Dormitory, DormitoryImage } from "@/features/dormitory";
import { descriptionJsonToText, parseDescription } from "@/lib/text";
import {
  X,
  MapPin,
  Info,
  Home,
  DollarSign,
  Zap,
  Droplet,
  Calendar,
  AlertCircle,
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
interface DormsDialogProps {
  dorm: Dormitory;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DormsDialog({
  dorm,
  onClose,
  onEdit,
}: DormsDialogProps) {
  useHotkeys("esc", () => {
    onClose();
  });
  const closeRef = useRef<HTMLDivElement>(null!);
  useOnClickOutside(closeRef, onClose);

  const [initialData, setInitialData] = useState<DormFormData | null>(null);

  useEffect(() => {
    setInitialData({ ...formData });
  }, []);

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

  const updateField = useCallback((field: keyof DormFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);
  const handleSave = async () => {
    const payload: DormFormData = {
      ...formData,
      description: parseDescription(formData.description),
    };

    if (initialData && isEqual(initialData, payload)) {
      toast.success("บันทึกข้อมูลเรียบร้อย");
      onClose();
      return;
    }

    try {
      await toast.promise(DormService.updateDorm(payload), {
        pending: "กําลังบันทึกข้อมูล...",
        success: "บันทึกข้อมูลเรียบร้อย",
      });

      onEdit?.();
      onClose();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  return (
    <RemoveScroll>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div
          ref={closeRef}
          className="relative mx-4 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent">
              แก้ไขข้อมูลหอพัก
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="ปิด"
            >
              <X size={24} />
            </button>
          </div>

          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-1 flex-col overflow-y-auto p-6">
            <form
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Info size={16} /> ชื่อหอพัก{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="เช่น หอพักสุขใจ"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Info size={16} /> ราคาห้องเช่า (จะแสดงในหน้าหลัก){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.roomPrice}
                  onChange={(e) => updateField("roomPrice", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="ราคาห้องพัก"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <AlertCircle size={16} /> คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="พิมพ์รายละเอียด เช่น สิ่งอำนวยความสะดวก"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <MapPin size={16} /> ที่อยู่
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="เลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <MapPin size={16} /> ลิงก์ Google Maps
                </label>
                <input
                  type="url"
                  value={formData.mapUrl}
                  onChange={(e) => updateField("mapUrl", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Zap size={16} /> ราคาค่าไฟ (บาท/หน่วย)
                </label>
                <input
                  type="number"
                  value={formData.electricRate}
                  onChange={(e) =>
                    updateField("electricRate", parseFloat(e.target.value))
                  }
                  step="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Droplet size={16} /> ราคาค่าน้ำ (บาท/หน่วย)
                </label>
                <input
                  type="number"
                  value={formData.waterRate}
                  onChange={(e) =>
                    updateField("waterRate", parseFloat(e.target.value))
                  }
                  step="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <DollarSign size={16} /> ค่าส่วนกลาง (บาท/เดือน) (ไม่บังคับ)
                </label>
                <input
                  type="number"
                  value={formData.commonFee}
                  onChange={(e) =>
                    updateField("commonFee", parseFloat(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <AlertCircle size={16} /> ค่าปรับชำระล่าช้า (บาท/วัน)
                </label>
                <input
                  type="number"
                  value={formData.lateFee}
                  onChange={(e) =>
                    updateField("lateFee", parseFloat(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Calendar size={16} /> ชำระไม่เกินวันที่
                </label>
                <input
                  type="number"
                  value={formData.dueDay}
                  onChange={(e) =>
                    updateField("dueDay", parseFloat(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Calendar size={16} /> กำหนดชำระค่าเช่า
                </label>
                <select
                  value={formData.dueMonthOffset}
                  onChange={(e) =>
                    updateField("dueMonthOffset", parseInt(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value={0}>ชำระภายในเดือนที่ออกบิล</option>
                  <option value={1}>ชำระเดือนถัดไปไม่เกินวันที่กำหนด</option>
                </select>
              </div>
            </form>

            <div className="mt-6">
              <ImageSection dormId={dorm.id} />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 transition hover:cursor-pointer hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSave}
              className="rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-2.5 font-medium text-white transition hover:cursor-pointer hover:bg-blue-700 hover:opacity-90"
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
}
