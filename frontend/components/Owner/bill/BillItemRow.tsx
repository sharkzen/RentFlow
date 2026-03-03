import { useState } from "react";
import {
  Trash2,
  Droplets,
  Zap,
  Edit,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import RoomSelector from "./RoomSelector";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface RoomData {
  id: string;
  roomNumber: string;
  tenantName: string | null;
  lastWaterUnit: number;
  lastElectricUnit: number;
  hasLastBill: boolean;
}

interface BillItem {
  id: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  prevWater: number;
  currentWater: number | "";
  waterImage?: string;
  prevElectric: number;
  currentElectric: number | "";
  electricImage?: string;
  isPrevEditable: boolean;
}

interface BillItemRowProps {
  item: BillItem;
  index: number;
  availableRooms: RoomData[];
  isLoadingRooms: boolean;
  isSubmitting: boolean;
  canRemove: boolean;
  onRoomSelect: (index: number, roomId: string) => void;
  onChange: (index: number, field: keyof BillItem, value: any) => void;
  onRemove: (id: string) => void;
  onCaptureImage: (index: number, type: "WATER" | "ELECTRIC") => void;
  onViewImage: (url: string) => void;
  onDeleteImage: (index: number, type: "WATER" | "ELECTRIC") => void;
}

export default function BillItemRow({
  item,
  index,
  availableRooms,
  isLoadingRooms,
  isSubmitting,
  canRemove,
  onRoomSelect,
  onChange,
  onRemove,
  onCaptureImage,
  onViewImage,
  onDeleteImage,
}: BillItemRowProps) {
  const [imageToDelete, setImageToDelete] = useState<
    "WATER" | "ELECTRIC" | null
  >(null);

  const waterUsage =
    (item.currentWater !== "" ? Number(item.currentWater) : 0) - item.prevWater;
  const electricUsage =
    (item.currentElectric !== "" ? Number(item.currentElectric) : 0) -
    item.prevElectric;

  const toggleEditPrev = () => {
    onChange(index, "isPrevEditable", !item.isPrevEditable);
  };

  const handleConfirmDeleteImage = () => {
    if (imageToDelete) {
      onDeleteImage(index, imageToDelete);
    }

    setImageToDelete(null);
  };

  return (
    <div className="group relative grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 pt-8 transition-all hover:border-indigo-300 lg:grid-cols-12 lg:items-start lg:pt-4">
      <div className="absolute top-0 left-0 z-10 flex items-center justify-center rounded-tl-xl rounded-br-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white">
        #{index + 1}
      </div>
      <div className="col-span-1 lg:col-span-3">
        <RoomSelector
          value={item.roomId}
          onChange={(roomId) => onRoomSelect(index, roomId)}
          rooms={availableRooms}
          disabled={isSubmitting}
          isLoading={isLoadingRooms}
        />
        {item.tenantName && (
          <p className="mt-1 px-1 text-[10px] text-gray-400">
            ผู้เช่า: {item.tenantName}
          </p>
        )}
      </div>
      <div className="col-span-1 rounded-lg border border-blue-100 bg-blue-50/30 p-3 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
            <Droplets size={14} className="text-blue-600" />
            ประปา
          </div>
          <div className="flex items-center gap-2">
            {item.waterImage && (
              <>
                <img
                  src={item.waterImage}
                  onClick={() => onViewImage(item.waterImage!)}
                  className="h-7 w-7 cursor-pointer rounded border border-blue-200 object-cover transition-transform hover:scale-110"
                  alt="water"
                />
                <button
                  type="button"
                  onClick={() => setImageToDelete("WATER")}
                  className="flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  ลบรูป
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onCaptureImage(index, "WATER")}
              className={`cursor-pointer rounded-md p-1.5 transition-colors ${item.waterImage ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
            >
              <Camera size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400">
                ครั้งก่อน
              </label>
              <button
                type="button"
                onClick={toggleEditPrev}
                className="flex cursor-pointer items-center gap-0.5 text-[10px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
              >
                <Edit size={10} />
                <span>{item.isPrevEditable ? "ล็อก" : "แก้ไข"}</span>
              </button>
            </div>
            <input
              type="number"
              value={item.prevWater}
              disabled={!item.isPrevEditable || isSubmitting}
              onChange={(e) => onChange(index, "prevWater", e.target.value)}
              className={`h-9 w-full rounded-lg border text-center text-sm font-bold transition-all outline-none ${item.isPrevEditable ? "border-indigo-300 bg-white ring-2 ring-indigo-100" : "border-gray-200 bg-gray-100 text-gray-500"}`}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-bold text-blue-600">
              ล่าสุด
            </label>
            <input
              type="number"
              value={item.currentWater}
              disabled={isSubmitting}
              onChange={(e) => onChange(index, "currentWater", e.target.value)}
              className={`h-9 w-full rounded-lg border text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200 ${waterUsage < 0 ? "border-red-300 bg-red-50" : "border-blue-200"}`}
            />
          </div>
        </div>
      </div>
      <div className="col-span-1 rounded-lg border border-amber-100 bg-amber-50/30 p-3 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <Zap size={14} className="text-amber-600" />
            ไฟฟ้า
          </div>
          <div className="flex items-center gap-2">
            {item.electricImage && (
              <>
                <img
                  src={item.electricImage}
                  onClick={() => onViewImage(item.electricImage!)}
                  className="h-7 w-7 cursor-pointer rounded border border-amber-200 object-cover transition-transform hover:scale-110"
                  alt="electric"
                />
                <button
                  type="button"
                  onClick={() => setImageToDelete("ELECTRIC")}
                  className="flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  ลบรูป
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onCaptureImage(index, "ELECTRIC")}
              className={`cursor-pointer rounded-md p-1.5 transition-colors ${item.electricImage ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600 hover:bg-amber-200"}`}
            >
              <Camera size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400">
                ครั้งก่อน
              </label>
              <button
                type="button"
                onClick={toggleEditPrev}
                className="flex cursor-pointer items-center gap-0.5 text-[10px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
              >
                <Edit size={10} />
                <span>{item.isPrevEditable ? "ล็อก" : "แก้ไข"}</span>
              </button>
            </div>
            <input
              type="number"
              value={item.prevElectric}
              disabled={!item.isPrevEditable || isSubmitting}
              onChange={(e) => onChange(index, "prevElectric", e.target.value)}
              className={`h-9 w-full rounded-lg border text-center text-sm font-bold transition-all outline-none ${item.isPrevEditable ? "border-indigo-300 bg-white ring-2 ring-indigo-100" : "border-gray-200 bg-gray-100 text-gray-500"}`}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-bold text-amber-600">
              ล่าสุด
            </label>
            <input
              type="number"
              value={item.currentElectric}
              disabled={isSubmitting}
              onChange={(e) =>
                onChange(index, "currentElectric", e.target.value)
              }
              className={`h-9 w-full rounded-lg border text-center text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200 ${electricUsage < 0 ? "border-red-300 bg-red-50" : "border-amber-200"}`}
            />
          </div>
        </div>
      </div>
      <div className="col-span-1 flex items-center justify-center lg:h-20">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove || isSubmitting}
          className="cursor-pointer text-gray-300 transition-colors hover:text-red-500 disabled:opacity-0"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <ConfirmDialog
        isOpen={imageToDelete !== null}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleConfirmDeleteImage}
        title="ยืนยันการลบรูปภาพ"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพมิเตอร์${imageToDelete === "WATER" ? "ประปา" : "ไฟฟ้า"}?`}
        type="error"
        confirmText="ลบรูปภาพ"
        cancelText="ยกเลิก"
      />
    </div>
  );
}
