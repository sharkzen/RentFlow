"use client";
import { useState, useEffect, useRef, type RefObject } from "react";

import {
  X,
  Plus,
  Trash2,
  Save,
  Calendar,
  Droplets,
  Zap,
  User,
  Home,
  AlertCircle,
  Coins,
  Building,
  ChevronDown,
} from "lucide-react";

import { toast } from "react-toastify";
import { format, getYear, getMonth, setMonth, setYear } from "date-fns";
import { th } from "date-fns/locale";
import { useOnClickOutside } from "usehooks-ts";
import { RoomService } from "@/features/room/services/room.service";

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
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(monthPickerRef as RefObject<HTMLElement>, () =>
    setIsMonthPickerOpen(false),
  );

  const [items, setItems] = useState<BillItem[]>([
    {
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
    },
  ]);

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
      console.error(error);
      toast.error("ไม่สามารถดึงข้อมูลห้องพักได้");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
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
      },
    ]);
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
    console.log("Submit clicked. Checking validation...");
    const invalidItems = items.filter(
      (i) => !i.roomId || i.currentWater === "" || i.currentElectric === "",
    );

    if (invalidItems.length > 0) {
      console.log("Validation Failed: Missing fields", invalidItems);
      toast.error("กรุณาเลือกห้องพัก และกรอกเลขมิเตอร์ให้ครบทุกช่อง");
      return;
    }

    const negativeUsage = items.some(
      (i) =>
        Number(i.currentWater) < i.prevWater ||
        Number(i.currentElectric) < i.prevElectric,
    );

    if (negativeUsage) {
      console.log("Validation Failed: Negative usage");
      toast.error("เลขมิเตอร์ใหม่ ต้องมากกว่าหรือเท่ากับเลขครั้งก่อน");
      return;
    }

    console.log("Validation Passed. Preparing payload...");

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

    console.log("Payload:", payload);
    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      console.log("onSubmit finished");
    } catch (err) {
      console.error("Error calling onSubmit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const currentYear = getYear(new Date());

  const years = Array.from(
    {
      length: 5,
    },
    (_, i) => currentYear - 2 + i,
  );

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = setMonth(selectedDate, monthIndex);
    setSelectedDate(newDate);
    setIsMonthPickerOpen(false);
  };

  const handleSelectYear = (year: number) => {
    const newDate = setYear(selectedDate, year);
    setSelectedDate(newDate);
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
                  <span className="line-clamp-1 max-w-[150px] font-medium text-gray-700 sm:max-w-none">
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
              <X
                size={20}
                className="transition-transform group-hover:rotate-90"
              />
            </button>
          </div>

          <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2 sm:border-t-0 sm:bg-transparent sm:px-6 sm:pt-0 sm:pb-4">
            <div
              className="relative w-full sm:ml-auto sm:flex sm:w-auto sm:justify-end"
              ref={monthPickerRef}
            >
              <button
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-indigo-300 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start"
              >
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <span className="font-bold">
                    {format(selectedDate, "MMMM", {
                      locale: th,
                    })}
                  </span>
                  <span className="font-medium text-gray-500">
                    {getYear(selectedDate) + 543}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${isMonthPickerOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isMonthPickerOpen && (
                <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5 sm:right-0 sm:left-auto sm:w-72">
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <label className="mb-2 block text-xs font-semibold text-gray-500">
                      เลือกปี (พ.ศ.)
                    </label>
                    <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleSelectYear(year)}
                          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${getYear(selectedDate) === year ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                        >
                          {year + 543}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-500">
                      เลือกเดือน
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => handleSelectMonth(index)}
                          className={`cursor-pointer rounded-md px-2 py-2 text-xs font-medium transition-colors ${getMonth(selectedDate) === index ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"}`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/50 p-3 sm:p-6">
          <div className="hidden grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase lg:grid">
            <div className="col-span-3">ห้องพัก / ผู้เช่า</div>
            <div className="col-span-3">มิเตอร์น้ำ (หน่วย)</div>
            <div className="col-span-3">มิเตอร์ไฟ (หน่วย)</div>
            <div className="col-span-2">ค่าส่วนกลาง / หมายเหตุ</div>
            <div className="col-span-1 text-center">ลบ</div>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => {
              const waterUsage =
                (item.currentWater !== "" ? Number(item.currentWater) : 0) -
                item.prevWater;
              const electricUsage =
                (item.currentElectric !== ""
                  ? Number(item.currentElectric)
                  : 0) - item.prevElectric;
              const isWaterError = item.currentWater !== "" && waterUsage < 0;
              const isElectricError =
                item.currentElectric !== "" && electricUsage < 0;

              return (
                <div
                  key={item.id}
                  className="group relative grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md lg:grid-cols-12 lg:items-start"
                >
                  <div className="col-span-1 space-y-2 lg:col-span-3">
                    <label className="text-xs font-bold text-gray-700 lg:hidden">
                      เลือกห้องพัก
                    </label>
                    <div className="relative">
                      <Home className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                      <select
                        value={item.roomId}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          handleRoomSelect(index, e.target.value)
                        }
                        className={`h-10 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-9 text-sm font-medium transition-all outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400 ${!item.roomId ? "border-gray-300 text-gray-500 focus:border-indigo-500 focus:ring-indigo-100" : "border-indigo-200 bg-indigo-50/30 text-indigo-700 focus:border-indigo-500 focus:ring-indigo-100"}`}
                      >
                        <option value="" disabled>
                          -- เลือกห้องพัก --
                        </option>
                        {isLoadingRooms ? (
                          <option disabled>กำลังโหลดข้อมูล...</option>
                        ) : availableRooms.length > 0 ? (
                          availableRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              ห้อง {r.roomNumber}
                            </option>
                          ))
                        ) : (
                          <option disabled>ไม่มีห้องพักที่มีผู้เช่า</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg
                          className="h-4 w-4 fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {item.tenantName && (
                      <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5 text-xs text-gray-600">
                        <User size={12} />
                        <span className="max-w-50 truncate">
                          {item.tenantName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 rounded-lg border border-blue-100/50 bg-blue-50/30 p-3 lg:col-span-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded bg-blue-100 p-1 text-blue-600">
                        <Droplets size={14} />
                      </div>
                      <span className="text-xs font-bold text-blue-800">
                        ประปา
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] text-gray-400">
                          ครั้งก่อน
                        </label>
                        <input
                          type="number"
                          disabled={!item.isPrevEditable || isSubmitting}
                          value={item.prevWater}
                          onChange={(e) =>
                            handleChange(index, "prevWater", e.target.value)
                          }
                          className={`h-9 w-full rounded-lg border text-center text-sm transition-all outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:text-gray-500 ${item.isPrevEditable ? "border-blue-300 bg-white font-bold text-blue-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-medium text-blue-600">
                          ล่าสุด
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          disabled={isSubmitting}
                          value={item.currentWater}
                          onChange={(e) =>
                            handleChange(index, "currentWater", e.target.value)
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
                      <span className="text-xs font-bold text-amber-800">
                        ไฟฟ้า
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] text-gray-400">
                          ครั้งก่อน
                        </label>
                        <input
                          type="number"
                          disabled={!item.isPrevEditable || isSubmitting}
                          value={item.prevElectric}
                          onChange={(e) =>
                            handleChange(index, "prevElectric", e.target.value)
                          }
                          className={`h-9 w-full rounded-lg border text-center text-sm transition-all outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-gray-100 disabled:text-gray-500 ${item.isPrevEditable ? "border-amber-300 bg-white font-bold text-amber-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-medium text-amber-600">
                          ล่าสุด
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          disabled={isSubmitting}
                          value={item.currentElectric}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "currentElectric",
                              e.target.value,
                            )
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
                        type="number"
                        placeholder="ส่วนกลาง/อื่น"
                        disabled={isSubmitting}
                        value={item.commonFee || ""}
                        onChange={(e) =>
                          handleChange(index, "commonFee", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 py-2 pr-2 pl-9 text-sm transition-all outline-none placeholder:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="หมายเหตุ (ถ้ามี) เช่น +ค่าของ"
                      disabled={isSubmitting}
                      value={item.note}
                      onChange={(e) =>
                        handleChange(index, "note", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs transition-all outline-none placeholder:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center lg:pt-4">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1 || isSubmitting}
                      className="group/btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-0"
                      title="ลบรายการ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
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
