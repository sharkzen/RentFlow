"use client";
import { useState, useEffect } from "react";
import { X, Plus, Save, Calendar, Building } from "lucide-react";
import log from "@/lib/logger";
import { toast } from "react-toastify";
import { RoomService } from "@/features/room/services/room.service";
import BillItemRow from "./BillItemRow";
import MonthYearPicker from "./MonthYearPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  selectedDormId: string;
  dormName: string;
}

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

export default function CreateBillDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedDormId,
  dormName,
}: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEmptyItem = (): BillItem => ({
    id: crypto.randomUUID(),
    roomId: "",
    roomNumber: "",
    tenantName: "",
    prevWater: 0,
    currentWater: "",
    prevElectric: 0,
    currentElectric: "",
    commonFee: 0,
    note: "",
    isPrevEditable: false,
  });

  const [items, setItems] = useState<BillItem[]>([createEmptyItem()]);

  useEffect(() => {
    if (isOpen && selectedDormId) {
      fetchRooms();
    }
  }, [isOpen, selectedDormId]);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);

    try {
      const res = await RoomService.getRooms(selectedDormId, "OCCUPIED");
      setAvailableRooms(res);
    } catch (error) {
      log.error(error);
      toast.error("ไม่สามารถดึงข้อมูลห้องพักได้");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.info("ต้องมีรายการอย่างน้อย 1 รายการ");
      return;
    }

    setItems(items.filter((i) => i.id !== id));
  };

  const handleRoomSelect = (index: number, roomId: string) => {
    const roomData = availableRooms.find((r) => r.id === roomId);

    if (!roomData) return;

    const isDuplicate = items.some(
      (item, idx) => idx !== index && item.roomId === roomId,
    );

    if (isDuplicate) {
      toast.warning(`ห้อง ${roomData.roomNumber} ถูกเลือกไปแล้ว`);
      const resetItems = [...items];
      resetItems[index].roomId = "";
      setItems(resetItems);
      return;
    }

    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      roomId: roomData.id,
      roomNumber: roomData.roomNumber,
      tenantName: roomData.tenantName || "-",
      isPrevEditable: !roomData.hasLastBill,
      prevWater: roomData.lastWaterUnit,
      prevElectric: roomData.lastElectricUnit,
      commonFee: roomData.commonFee,
      currentWater: "",
      currentElectric: "",
    };

    setItems(newItems);
  };

  const handleChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    setItems(newItems);
  };

  const handleSubmit = async () => {
    const invalidItems = items.filter(
      (i) => !i.roomId || i.currentWater === "" || i.currentElectric === "",
    );

    if (invalidItems.length > 0) {
      toast.error("กรุณาเลือกห้องพัก และกรอกเลขมิเตอร์ให้ครบทุกช่อง");
      return;
    }

    const negativeUsage = items.some(
      (i) =>
        Number(i.currentWater) < i.prevWater ||
        Number(i.currentElectric) < i.prevElectric,
    );

    if (negativeUsage) {
      toast.error("เลขมิเตอร์ใหม่ ต้องมากกว่าหรือเท่ากับเลขครั้งก่อน");
      return;
    }

    const payload = {
      billingMonth: selectedDate,

      items: items.map((i) => ({
        roomId: i.roomId,
        prevWater: Number(i.prevWater),
        currentWater: Number(i.currentWater),
        prevElectric: Number(i.prevElectric),
        currentElectric: Number(i.currentElectric),
        commonFee: Number(i.commonFee),
        note: i.note,
      })),
    };

    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      setItems([createEmptyItem()]);
    } catch (err) {
      log.error("Error calling onSubmit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasData =
    items.length > 1 ||
    items.some(
      (i) =>
        i.roomId !== "" ||
        i.currentWater !== "" ||
        i.currentElectric !== "" ||
        i.note !== "",
    );

  const clearItems = () => {
    setItems([createEmptyItem()]);
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 transition-all duration-200 sm:p-4">
      <div className="flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200 sm:rounded-2xl">
        <div className="flex flex-col border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-gray-800 sm:text-xl">
                  สร้างบิลค่าเช่า
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 sm:text-sm">
                  <Building size={12} className="shrink-0" />
                  <span className="line-clamp-1 max-w-37.5 font-medium text-gray-700 sm:max-w-none">
                    {dormName}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="group cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={20} className="transition-transform" />
            </button>
          </div>
          <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2 sm:border-t-0 sm:bg-transparent sm:px-6 sm:pt-0 sm:pb-4">
            <MonthYearPicker
              selectedDate={selectedDate}
              onChange={setSelectedDate}
              disabled={isSubmitting}
            />
          </div>
        </div>
        {hasData && (
          <div className="flex items-center justify-end border-b border-gray-50 bg-gray-50/30 px-4 py-2">
            <button
              onClick={clearItems}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
            >
              ล้างค่าทั้งหมด <X size={14} />
            </button>
          </div>
        )}
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/50 p-3 sm:p-6">
          <div className="hidden grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase lg:grid">
            <div className="col-span-3">ห้องพัก / ผู้เช่า</div>
            <div className="col-span-3">มิเตอร์น้ำ (หน่วย)</div>
            <div className="col-span-3">มิเตอร์ไฟ (หน่วย)</div>
            <div className="col-span-2">ค่าส่วนกลาง / หมายเหตุ</div>
            <div className="col-span-1 text-center">ลบ</div>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <BillItemRow
                key={item.id}
                item={item}
                index={index}
                availableRooms={availableRooms}
                isLoadingRooms={isLoadingRooms}
                isSubmitting={isSubmitting}
                canRemove={items.length > 1}
                onRoomSelect={handleRoomSelect}
                onChange={handleChange}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
          <button
            onClick={handleAddItem}
            disabled={isSubmitting}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 py-3 text-sm font-medium text-indigo-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            เพิ่มรายการห้อง
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="block text-xs text-gray-500 sm:text-sm">
            <span className="font-medium text-gray-900">{items.length}</span>{" "}
            รายการ
          </div>
          <div className="flex flex-1 justify-end gap-2 sm:flex-none sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-400 sm:text-sm"
            >
              <Save size={16} className="sm:hidden" />
              <Save size={18} className="hidden sm:block" />
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</span>
              <span className="hidden sm:inline">{!isSubmitting && "บิล"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
