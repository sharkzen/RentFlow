"use client";
import { useState, useEffect, useRef, type RefObject } from "react";

import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Home,
  Save,
  Contact,
  Lock,
  ChevronDown,
  Check,
  Search,
  MapPin,
  Users,
  Coins,
  Calendar,
} from "lucide-react";

import { Rooms } from "@/features/room/types";
import { RoomService } from "@/features/room/services/room.service";
import { TenantService } from "@/features/tenant/services/tenant.service";
import log from "@/lib/logger";
import { toast } from "react-toastify";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";
import { getTenantErrorMessage } from "@/features/tenant/constants/error-messages";
import DatePickerTh from "@/components/ui/DatePickerTh";

interface AddTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dormId: string;
  onSuccess: () => void;
  initialData?: any;
}

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextYearString = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AddTenantDialog({
  isOpen,
  onClose,
  dormId,
  onSuccess,
  initialData,
}: AddTenantDialogProps) {
  useScrollLock();
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<Rooms[]>([]);
  const [isRoomSelectOpen, setIsRoomSelectOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const roomSelectRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(roomSelectRef as RefObject<HTMLElement>, () =>
    setIsRoomSelectOpen(false),
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    idCard: "",
    address: "",
    roomId: "",
    moveInDate: getTodayString(),
    contractStartDate: getTodayString(),
    contractEndDate: getNextYearString(),
    numberOfResidents: 1,
    securityDeposit: 0,
    advancePayment: 0,
    entranceFee: 0,
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        roomId: "",
        securityDeposit: 0,
        advancePayment: 0,
        entranceFee: 0,
        password: "",
        moveInDate: getTodayString(),
        contractStartDate: getTodayString(),
        contractEndDate: getNextYearString(),
      }));
    } else if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectRoom = (roomId: string) => {
    setFormData((prev) => ({
      ...prev,
      roomId,
    }));

    setIsRoomSelectOpen(false);
    setRoomSearch("");
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.roomNumber?.toLowerCase().includes(roomSearch.toLowerCase()) ||
      room.floor?.toString().includes(roomSearch),
  );

  const selectedRoomObj = rooms.find((r) => r.id === formData.roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.roomId) {
      toast.error("กรุณาเลือกห้องพัก");
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast.error("กรุณาระบุชื่อ-นามสกุล");
      setIsLoading(false);
      return;
    }

    if (!formData.email) {
      toast.error("กรุณาระบุอีเมลสำหรับเข้าใช้งาน");
      setIsLoading(false);
      return;
    }

    try {
      const isReEntry = !!initialData?.userId;

      const payload = {
        ...formData,
        dormId: dormId,
        userId: isReEntry ? initialData.userId : undefined,
      };

      const apiCall = isReEntry
        ? TenantService.reEntryTenant(payload)
        : TenantService.createTenant(payload);

      await toast.promise(apiCall, {
        pending: "กำลังบันทึกข้อมูล...",
        success: isReEntry
          ? "ทำสัญญาใหม่ให้ผู้เช่าเดิมเรียบร้อยแล้ว"
          : "เพิ่มผู้เช่าใหม่เรียบร้อยแล้ว",

        error: {
          render({ data }: any) {
            const errorResponse = data?.response?.data;
            const code = errorResponse?.code;
            return getTenantErrorMessage(code, errorResponse?.message);
          },
        },
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      log.error("Submit Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      idCard: "",
      address: "",
      roomId: "",
      moveInDate: getTodayString(),
      contractStartDate: getTodayString(),
      contractEndDate: getNextYearString(),
      numberOfResidents: 1,
      securityDeposit: 0,
      advancePayment: 0,
      entranceFee: 0,
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    });
  };

  const inputBaseClass =
    "w-full h-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all placeholder:text-gray-400";
  const inputClass = `${inputBaseClass} px-3`;
  const inputWithIconClass = `${inputBaseClass} pl-10 pr-3`;
  const iconClass =
    "absolute top-3 left-3 h-4 w-4 text-gray-400 pointer-events-none";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 transition-all duration-200">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {initialData ? "ทำสัญญาใหม่ให้ผู้เช่าเดิม" : "เพิ่มผู้เช่าใหม่"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              กรอกข้อมูลเพื่อสร้างบัญชี ทำสัญญาเช่า และบันทึกข้อมูลการเงิน
            </p>
          </div>
          <button
            onClick={onClose}
            className="group cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95"
          >
            <X
              size={20}
              className="transition-transform group-hover:rotate-90"
            />
          </button>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex-1 overflow-y-auto bg-gray-50/30 p-2">
          <form
            id="add-tenant-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-87.5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <Home size={16} />
                    ข้อมูลห้องพักและสัญญา
                  </h3>
                  <div className="space-y-4">
                    <div ref={roomSelectRef} className="relative z-20">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        เลือกห้องพัก <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRoomSelectOpen(!isRoomSelectOpen)}
                        className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:ring-indigo-200 focus:outline-none ${formData.roomId ? "border-indigo-200 bg-indigo-50/50 text-indigo-900" : "border-gray-300 bg-white text-gray-500 hover:border-gray-400"}`}
                      >
                        <span className="truncate">
                          {selectedRoomObj
                            ? `ห้อง ${selectedRoomObj.roomNumber} (ชั้น ${selectedRoomObj.floor}) - ฿${selectedRoomObj.basePrice.toLocaleString()}`
                            : "-- เลือกห้องพัก --"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`ml-2 text-gray-400 transition-transform duration-200 ${isRoomSelectOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isRoomSelectOpen && (
                        <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 duration-100">
                          <div className="sticky top-0 border-b border-gray-100 bg-gray-50 p-2">
                            <div className="relative">
                              <Search
                                size={14}
                                className="absolute top-2.5 left-3 text-gray-400"
                              />
                              <input
                                type="text"
                                autoFocus
                                placeholder="ค้นหาเลขห้อง..."
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                                className="h-9 w-full rounded-md border border-gray-200 bg-white pr-3 pl-9 text-xs focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <ul className="max-h-56 overflow-y-auto py-1">
                            {filteredRooms.length > 0 ? (
                              filteredRooms.map((room) => (
                                <li
                                  key={room.id}
                                  onClick={() => handleSelectRoom(room.id)}
                                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-indigo-50 ${formData.roomId === room.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700"}`}
                                >
                                  <div>
                                    <div>ห้อง {room.roomNumber}</div>
                                    <div className="text-[10px] text-gray-500">
                                      ชั้น {room.floor}•{" "}
                                      {room.type === "AIR" ? "แอร์" : "พัดลม"}
                                    </div>
                                  </div>
                                  {formData.roomId === room.id && (
                                    <Check
                                      size={14}
                                      className="text-indigo-600"
                                    />
                                  )}
                                </li>
                              ))
                            ) : (
                              <li className="px-4 py-6 text-center text-xs text-gray-400">
                                ไม่พบห้องพัก
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <DatePickerTh
                          label="วันเริ่มสัญญา"
                          value={formData.contractStartDate}
                          onChange={(date) =>
                            handleDateChange("contractStartDate", date)
                          }
                        />
                      </div>
                      <div>
                        <DatePickerTh
                          label="วันสิ้นสุดสัญญา"
                          value={formData.contractEndDate}
                          onChange={(date) =>
                            handleDateChange("contractEndDate", date)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <DatePickerTh
                          label="เข้าพัก (Move In)"
                          required
                          value={formData.moveInDate}
                          onChange={(date) =>
                            handleDateChange("moveInDate", date)
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          จำนวนผู้พัก (คน)
                        </label>
                        <div className="relative">
                          <Users className={iconClass} />
                          <input
                            inputMode={"numeric"}
                            pattern="[0-9]*"
                            type="number"
                            min="1"
                            name="numberOfResidents"
                            value={formData.numberOfResidents}
                            onChange={handleChange}
                            className={`${inputWithIconClass} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-600 uppercase">
                    <Coins size={16} />
                    ข้อมูลการเงิน (วันทำสัญญา)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        เงินประกันความเสียหาย
                      </label>
                      <div className="relative w-full">
                        <span className="absolute top-2.5 left-3 font-sans text-sm text-gray-400">
                          ฿
                        </span>
                        <input
                          type="number"
                          min="0"
                          name="securityDeposit"
                          value={formData.securityDeposit}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={`${inputWithIconClass} focus:border-emerald-500 focus:ring-emerald-200`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          ค่าเช่าล่วงหน้า
                        </label>
                        <div className="relative">
                          <span className="absolute top-2.5 left-3 font-sans text-sm text-gray-400">
                            ฿
                          </span>
                          <input
                            type="number"
                            min="0"
                            name="advancePayment"
                            value={formData.advancePayment}
                            onChange={handleChange}
                            placeholder="0.00"
                            className={`${inputWithIconClass} focus:border-emerald-500 focus:ring-emerald-200`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          ค่าแรกเข้า
                        </label>
                        <div className="relative">
                          <span className="absolute top-2.5 left-3 font-sans text-sm text-gray-400">
                            ฿
                          </span>
                          <input
                            type="number"
                            min="0"
                            name="entranceFee"
                            value={formData.entranceFee}
                            onChange={handleChange}
                            placeholder="0.00"
                            className={`${inputWithIconClass} focus:border-emerald-500 focus:ring-emerald-200`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-600 uppercase">
                    <Contact size={16} />
                    ข้อมูลผู้ติดต่อฉุกเฉิน
                  </h3>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        ชื่อผู้ติดต่อ
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        เบอร์โทร
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");

                          handleChange({
                            target: {
                              name: "emergencyContactPhone",
                              value,
                            },
                          } as any);
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      placeholder="เช่น นัดทำสัญญา, ย้ายของ..."
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-87.5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <User size={16} />
                    ข้อมูลส่วนตัวผู้เช่า
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          ชื่อจริง <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          เบอร์โทรศัพท์
                        </label>
                        <div className="relative">
                          <Phone className={iconClass} />
                          <input
                            type="tel"
                            maxLength={10}
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              );

                              handleChange({
                                target: {
                                  name: "phone",
                                  value,
                                },
                              } as any);
                            }}
                            className={inputWithIconClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          เลขบัตรประชาชน
                        </label>
                        <div className="relative">
                          <CreditCard className={iconClass} />
                          <input
                            type="text"
                            maxLength={13}
                            name="idCard"
                            value={formData.idCard}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              );

                              handleChange({
                                target: {
                                  name: "idCard",
                                  value,
                                },
                              } as any);
                            }}
                            className={inputWithIconClass}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        ที่อยู่ตามทะเบียนบ้าน/บัตร ปชช.
                      </label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-gray-400" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={3}
                          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                          placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <Lock size={16} />
                    บัญชีเข้าใช้งาน (App Login)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className={iconClass} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={!!initialData?.userId}
                          className={`${inputWithIconClass} ${initialData?.userId ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}`}
                        />
                        {initialData?.userId && (
                          <p className="mt-1 text-[10px] text-orange-500">
                            * ใช้บัญชีอีเมลเดิมของผู้เช่า ไม่สามารถแก้ไขได้
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        รหัสผ่าน{" "}
                        <span className="font-normal text-gray-400">
                          (เว้นว่างเพื่อใช้เบอร์โทร)
                        </span>
                      </label>
                      <div className="relative">
                        <Lock className={iconClass} />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="กำหนดรหัสผ่านเอง (Optional)"
                          className={inputWithIconClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            disabled={isLoading}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            <Save size={18} />
            {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}
