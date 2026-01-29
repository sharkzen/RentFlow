import { Trash2, Droplets, Zap, Coins, Edit } from "lucide-react";
import RoomSelector from "./RoomSelector";

interface RoomData {
  id: string;
  roomNumber: string;
  tenantName: string | null;
  lastWaterUnit: number;
  lastElectricUnit: number;
  hasLastBill: boolean;
  commonFee: number;
}

interface BillItem {
  id: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  prevWater: number;
  currentWater: number | "";
  prevElectric: number;
  currentElectric: number | "";
  commonFee: number;
  note: string;
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
}: BillItemRowProps) {
  const waterUsage =
    (item.currentWater !== "" ? Number(item.currentWater) : 0) - item.prevWater;
  const electricUsage =
    (item.currentElectric !== "" ? Number(item.currentElectric) : 0) -
    item.prevElectric;
  const isWaterError = item.currentWater !== "" && waterUsage < 0;
  const isElectricError = item.currentElectric !== "" && electricUsage < 0;

  const toggleEditPrev = () => {
    onChange(index, "isPrevEditable", !item.isPrevEditable);
  };

  return (
    <>
      <div className="group relative grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 pt-8 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md lg:grid-cols-12 lg:items-start lg:pt-4">
        <div className="absolute top-0 left-0 z-10 flex items-center justify-center rounded-tl-xl rounded-br-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          #{index + 1}
        </div>
        <div className="col-span-1 space-y-2 lg:col-span-3">
          <label className="text-xs font-bold text-gray-700 lg:hidden">
            เลือกห้องพัก
          </label>
          <RoomSelector
            value={item.roomId}
            onChange={(roomId) => onRoomSelect(index, roomId)}
            rooms={availableRooms}
            disabled={isSubmitting}
            isLoading={isLoadingRooms}
          />
        </div>
        <div className="col-span-1 rounded-lg border border-blue-100/50 bg-blue-50/30 p-3 lg:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded bg-blue-100 p-1 text-blue-600">
              <Droplets size={14} />
            </div>
            <span className="text-xs font-bold text-blue-800">ประปา</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] text-gray-400">ครั้งก่อน</label>
                <button
                  type="button"
                  onClick={toggleEditPrev}
                  disabled={isSubmitting || !item.roomId}
                  className={`flex cursor-pointer items-center gap-0.5 text-[10px] transition-colors ${item.isPrevEditable ? "font-bold text-blue-600" : "text-gray-400 hover:text-blue-600"} disabled:opacity-0`}
                  title="แก้ไขค่ามิเตอร์เก่า"
                >
                  <Edit size={10} />
                  <span>{item.isPrevEditable ? "ล็อก" : "แก้"}</span>
                </button>
              </div>
              <input
                min={0}
                type="number"
                disabled={!item.isPrevEditable || isSubmitting}
                value={item.prevWater}
                onChange={(e) => onChange(index, "prevWater", e.target.value)}
                className={`h-9 w-full rounded-lg border text-center text-sm transition-all outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:text-gray-500 ${item.isPrevEditable ? "border-blue-300 bg-white font-bold text-blue-700 shadow-sm ring-2 ring-blue-100" : "border-gray-200 bg-gray-100 text-gray-500"}`}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-medium text-blue-600">
                ล่าสุด
              </label>
              <input
                min={0}
                type="number"
                placeholder="0"
                disabled={isSubmitting}
                value={item.currentWater}
                onChange={(e) =>
                  onChange(index, "currentWater", e.target.value)
                }
                className={`h-9 w-full rounded-lg border text-center text-sm font-bold transition-all outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 ${isWaterError ? "border-red-300 bg-red-50 text-red-600" : "border-blue-200 text-gray-800 focus:border-blue-500"}`}
              />
            </div>
          </div>
          {item.currentWater !== "" && (
            <div
              className={`mt-1.5 text-right text-[10px] font-medium sm:text-xs ${isWaterError ? "text-red-500" : "text-blue-600"}`}
            >
              {isWaterError
                ? "เลขน้อยกว่าเดิม"
                : `ใช้: ${waterUsage.toLocaleString()} หน่วย`}
            </div>
          )}
        </div>
        <div className="col-span-1 rounded-lg border border-amber-100/50 bg-amber-50/30 p-3 lg:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded bg-amber-100 p-1 text-amber-600">
              <Zap size={14} />
            </div>
            <span className="text-xs font-bold text-amber-800">ไฟฟ้า</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] text-gray-400">ครั้งก่อน</label>
                <button
                  type="button"
                  onClick={toggleEditPrev}
                  disabled={isSubmitting || !item.roomId}
                  className={`flex cursor-pointer items-center gap-0.5 text-[10px] transition-colors ${item.isPrevEditable ? "font-bold text-amber-600" : "text-gray-400 hover:text-amber-600"} disabled:opacity-0`}
                  title="แก้ไขค่ามิเตอร์เก่า"
                >
                  <Edit size={10} />
                  <span>{item.isPrevEditable ? "ล็อก" : "แก้"}</span>
                </button>
              </div>
              <input
                min={0}
                type="number"
                disabled={!item.isPrevEditable || isSubmitting}
                value={item.prevElectric}
                onChange={(e) =>
                  onChange(index, "prevElectric", e.target.value)
                }
                className={`h-9 w-full rounded-lg border text-center text-sm transition-all outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-gray-100 disabled:text-gray-500 ${item.isPrevEditable ? "border-amber-300 bg-white font-bold text-amber-700 shadow-sm ring-2 ring-amber-100" : "border-gray-200 bg-gray-100 text-gray-500"}`}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-medium text-amber-600">
                ล่าสุด
              </label>
              <input
                min={0}
                type="number"
                placeholder="0"
                disabled={isSubmitting}
                value={item.currentElectric}
                onChange={(e) =>
                  onChange(index, "currentElectric", e.target.value)
                }
                className={`h-9 w-full rounded-lg border text-center text-sm font-bold transition-all outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100 ${isElectricError ? "border-red-300 bg-red-50 text-red-600" : "border-amber-200 text-gray-800 focus:border-amber-500"}`}
              />
            </div>
          </div>
          {item.currentElectric !== "" && (
            <div
              className={`mt-1.5 text-right text-[10px] font-medium sm:text-xs ${isElectricError ? "text-red-500" : "text-amber-600"}`}
            >
              {isElectricError
                ? "เลขน้อยกว่าเดิม"
                : `ใช้: ${electricUsage.toLocaleString()} หน่วย`}
            </div>
          )}
        </div>
        <div className="col-span-1 space-y-2 pt-1 lg:col-span-2">
          <label className="text-xs font-bold text-gray-700 lg:hidden">
            เพิ่มเติม
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Coins size={14} className="text-gray-400" />
            </div>
            <input
              min={0}
              type="number"
              placeholder="ส่วนกลาง"
              disabled={isSubmitting}
              value={item.commonFee || ""}
              onChange={(e) => onChange(index, "commonFee", e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pr-2 pl-9 text-sm transition-all outline-none placeholder:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
          <input
            type="text"
            placeholder="หมายเหตุ (ถ้ามี)"
            disabled={isSubmitting}
            value={item.note}
            onChange={(e) => onChange(index, "note", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </div>
        <div className="col-span-1 flex justify-center lg:col-span-1 lg:flex lg:h-full lg:items-center lg:pt-0">
          <button
            onClick={() => onRemove(item.id)}
            disabled={!canRemove || isSubmitting}
            className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-0"
            title="ลบรายการ"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
