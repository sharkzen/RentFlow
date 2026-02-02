import { useState, useEffect } from "react";
import { LandmarkType, CreateLandmarkPayload } from "@/features/admin/types";
import { Button } from "@/components/ui/Button";
import { Map, X, MapPin } from "lucide-react";
import { Landmark } from "@/features/admin/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLandmarkPayload) => Promise<void>;
  initialData?: Landmark | null;
}

export const LandmarkModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const [formData, setFormData] = useState<CreateLandmarkPayload>({
    name: "",
    type: LandmarkType.UNIVERSITY,
    mapUrl: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          type: initialData.type,
          mapUrl: initialData.mapUrl,
        });
      } else {
        setFormData({
          name: "",
          type: LandmarkType.UNIVERSITY,
          mapUrl: "",
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300">
      <div className="animate-in zoom-in-95 w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditMode ? "แก้ไขข้อมูลสถานที่" : "เพิ่มสถานที่ใหม่"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              ชื่อสถานที่ <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              className="h-11 w-full rounded-lg border border-transparent bg-gray-50 px-4 text-sm text-gray-900 transition-all hover:bg-gray-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              placeholder="เช่น มหาวิทยาลัย, เซ็นทรัล..."
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              ประเภท <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-lg border border-transparent bg-gray-50 px-4 text-sm text-gray-900 transition-all hover:bg-gray-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as LandmarkType,
                  })
                }
              >
                {Object.values(LandmarkType).map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              ลิงก์ Google Maps <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Map className="h-4 w-4 text-gray-400" />
              </div>
              <input
                required
                type="url"
                className="h-11 w-full rounded-lg border border-transparent bg-gray-50 pr-4 pl-10 text-sm text-gray-900 transition-all hover:bg-gray-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                placeholder="https://maps.app.goo.gl/..."
                value={formData.mapUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mapUrl: e.target.value,
                  })
                }
              />
            </div>
            <p className="text-xs text-gray-500">
              วางลิงก์จาก Google Maps ระบบจะ
              {isEditMode ? "คำนวณพิกัดใหม่" : "ดึงพิกัดให้อัตโนมัติ"}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 px-6 shadow-md shadow-blue-500/20 hover:bg-blue-700"
            >
              {isEditMode ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
