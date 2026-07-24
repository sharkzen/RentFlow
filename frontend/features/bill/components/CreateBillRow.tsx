import {
  User,
  Home,
  Droplets,
  Zap,
  Coins,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { CustomSelect } from "@/lib/ui/CustomSelect";

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

interface RoomData {
  id: string;
  roomNumber: string;
  tenantName: string | null;
}

interface Props {
  item: BillItem;
  index: number;
  availableRooms: RoomData[];
  isLoadingRooms: boolean;
  onRoomSelect: (index: number, roomId: string) => void;
  onChange: (index: number, field: keyof BillItem, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export default function CreateBillRow({
  item,
  index,
  availableRooms,
  isLoadingRooms,
  onRoomSelect,
  onChange,
  onRemove,
  canRemove,
}: Props) {
  const waterUsage =
    (item.currentWater !== "" ? Number(item.currentWater) : 0) - item.prevWater;
  const electricUsage =
    (item.currentElectric !== "" ? Number(item.currentElectric) : 0) -
    item.prevElectric;
  const isWaterError = item.currentWater !== "" && waterUsage < 0;
  const isElectricError = item.currentElectric !== "" && electricUsage < 0;

  return (
    <div className="group relative grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md lg:grid-cols-12 lg:items-start">
      <div className="col-span-1 space-y-2 lg:col-span-3">
        <label className="text-xs font-bold text-gray-700 lg:hidden">
          เลือกห้องพัก
        </label>
        <CustomSelect
          icon={<Home size={16} />}
          disabled={isLoadingRooms || availableRooms.length === 0}
          placeholder={
            isLoadingRooms
              ? "กำลังโหลดข้อมูล..."
              : availableRooms.length === 0
                ? "ไม่มีห้องพักที่มีผู้เช่า"
                : "-- เลือกห้องพัก --"
          }
          options={availableRooms.map((r) => ({
            value: r.id,
            label: `ห้อง ${r.roomNumber}`,
          }))}
          value={item.roomId || null}
          onChange={(val) => onRoomSelect(index, val)}
        />
        {item.tenantName && (
          <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5 text-xs text-gray-600">
            <User size={12} />
            <span className="max-w-50 truncate">{item.tenantName}</span>
          </div>
        )}
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
            <input
              type="number"
              disabled={!item.isPrevEditable}
              value={item.prevWater}
              onChange={(e) => onChange(index, "prevWater", e.target.value)}
              className={`h-8 w-full rounded border text-center text-sm ${item.isPrevEditable ? "border-blue-300 font-bold text-blue-700" : "bg-gray-100 text-gray-500"}`}
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="0"
              value={item.currentWater}
              onChange={(e) => onChange(index, "currentWater", e.target.value)}
              className={`h-8 w-full rounded border text-center text-sm font-bold ${isWaterError ? "border-red-300 bg-red-50 text-red-600" : "border-blue-200"}`}
            />
          </div>
        </div>
        {item.currentWater !== "" && (
          <div
            className={`mt-2 text-right text-xs font-medium ${isWaterError ? "text-red-500" : "text-blue-600"}`}
          >
            {isWaterError
              ? "เลขน้อยกว่าเดิม"
              : `ใช้ไป: ${waterUsage.toLocaleString()} หน่วย`}
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
            <input
              type="number"
              disabled={!item.isPrevEditable}
              value={item.prevElectric}
              onChange={(e) => onChange(index, "prevElectric", e.target.value)}
              className={`h-8 w-full rounded border text-center text-sm ${item.isPrevEditable ? "border-amber-300 font-bold text-amber-700" : "bg-gray-100 text-gray-500"}`}
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={item.currentElectric}
              onChange={(e) =>
                onChange(index, "currentElectric", e.target.value)
              }
              className={`h-8 w-full rounded border text-center text-sm font-bold ${isElectricError ? "border-red-300 bg-red-50 text-red-600" : "border-amber-200"}`}
            />
          </div>
        </div>
        {item.currentElectric !== "" && (
          <div
            className={`mt-2 text-right text-xs font-medium ${isElectricError ? "text-red-500" : "text-amber-600"}`}
          >
            {isElectricError
              ? "เลขน้อยกว่าเดิม"
              : `ใช้ไป: ${electricUsage.toLocaleString()} หน่วย`}
          </div>
        )}
      </div>
      <div className="col-span-1 space-y-2 pt-1 lg:col-span-2">
        <div className="relative">
          <Coins size={14} className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="number"
            placeholder="ส่วนกลาง"
            value={item.commonFee}
            onChange={(e) => onChange(index, "commonFee", e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-1.5 pr-2 pl-9 text-sm"
          />
        </div>
        <input
          type="text"
          placeholder="หมายเหตุ"
          value={item.note}
          onChange={(e) => onChange(index, "note", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
        />
      </div>
      <div className="col-span-1 flex justify-center lg:pt-4">
        <button
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-0"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
