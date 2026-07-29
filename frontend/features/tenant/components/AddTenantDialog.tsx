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
import { TenantReEntryData } from "@/features/tenant/types";
import log from "@/lib/logger";
import { toast } from "react-toastify";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";
import { getTenantErrorMessage } from "@/features/tenant/constants/error-messages";
import DatePickerTh from "@/lib/ui/DatePickerTh";
import Link from "next/link";

interface AddTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dormId: string;
  onSuccess: () => void;
  initialData?: TenantReEntryData | null;
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

  const fetchRooms = async () => {
    setIsLoading(true);

    try {
      const res = await RoomService.getRooms(dormId, "AVAILABLE");
      setRooms(res);
    } catch (error) {
      log.error(error);
      toast.error("ไม่สามารถดึงข้อมูลห้องพักได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dormId) {
      fetchRooms();
    }
  }, [isOpen, dormId]);

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
    "w-full h-10 rounded-lg border border-border bg-surface text-sm text-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all placeholder:text-muted";
  const inputClass = `${inputBaseClass} px-3`;
  const inputWithIconClass = `${inputBaseClass} pl-10 pr-3`;
  const iconClass =
    "absolute top-3 left-3 h-4 w-4 text-muted pointer-events-none";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 transition-all duration-200">
      <div className="bg-surface ring-border flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-xl ring-1">
        <div className="border-border bg-surface flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-foreground text-lg font-bold">
              {initialData ? "ทำสัญญาใหม่ให้ผู้เช่าเดิม" : "เพิ่มผู้เช่าใหม่"}
            </h2>
            <p className="text-muted mt-0.5 text-xs">
              กรอกข้อมูลเพื่อสร้างบัญชี ทำสัญญาเช่า และบันทึกข้อมูลการเงิน
            </p>
          </div>
          <button
            onClick={onClose}
            className="group bg-background text-muted hover:bg-border hover:text-foreground cursor-pointer rounded-full p-2 transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-background/30 flex-1 overflow-y-auto p-2">
          <form
            id="add-tenant-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="border-border bg-surface rounded-xl border p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-87.5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <Home size={16} />
                    ข้อมูลห้องพักและสัญญา
                  </h3>
                  <div className="space-y-4">
                    <div ref={roomSelectRef} className="relative">
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
                        เลือกห้องพัก <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRoomSelectOpen(!isRoomSelectOpen)}
                        className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:ring-indigo-200 focus:outline-none ${formData.roomId ? "border-indigo-200 bg-indigo-50/50 text-indigo-900" : "border-border bg-surface text-muted hover:border-muted"}`}
                      >
                        <span className="truncate">
                          {selectedRoomObj
                            ? `ห้อง ${selectedRoomObj.roomNumber} (ชั้น ${selectedRoomObj.floor}) - ฿${selectedRoomObj.basePrice.toLocaleString()}`
                            : "-- เลือกห้องพัก --"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-muted ml-2 transition-transform duration-200 ${isRoomSelectOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isRoomSelectOpen && (
                        <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-xl ring-1 ring-black/5 duration-100">
                          <div className="border-border bg-background sticky top-0 border-b p-2">
                            <div className="relative">
                              <Search
                                size={14}
                                className="text-muted absolute top-2.5 left-3"
                              />
                              <input
                                type="text"
                                autoFocus
                                placeholder="ค้นหาเลขห้อง..."
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                                className="border-border bg-surface h-9 w-full rounded-md border pr-3 pl-9 text-xs focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <ul className="max-h-56 overflow-y-auto py-1">
                            {filteredRooms.length > 0 ? (
                              filteredRooms.map((room) => (
                                <li
                                  key={room.id}
                                  onClick={() => handleSelectRoom(room.id)}
                                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-indigo-50 ${formData.roomId === room.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground"}`}
                                >
                                  <div>
                                    <div>ห้อง {room.roomNumber}</div>
                                    <div className="text-muted text-[10px]">
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
                              <li className="text-muted px-4 py-6 text-center text-xs">
                                ไม่พบห้องพักกรุณา
                                <Link
                                  className="text-blue-500 underline"
                                  href="/owner/rooms"
                                >
                                  สร้าง
                                </Link>
                                ห้องพักก่อน
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                <div className="border-border bg-surface rounded-xl border p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-600 uppercase">
                    <Coins size={16} />
                    ข้อมูลการเงิน (วันทำสัญญา)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
                        เงินประกันความเสียหาย
                      </label>
                      <div className="relative w-full">
                        <span className="text-muted absolute top-2.5 left-3 font-sans text-sm">
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
                          ค่าเช่าล่วงหน้า
                        </label>
                        <div className="relative">
                          <span className="text-muted absolute top-2.5 left-3 font-sans text-sm">
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
                          ค่าแรกเข้า
                        </label>
                        <div className="relative">
                          <span className="text-muted absolute top-2.5 left-3 font-sans text-sm">
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
                <div className="border-border bg-surface rounded-xl border p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="text-muted mb-4 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                    <Contact size={16} />
                    ข้อมูลผู้ติดต่อฉุกเฉิน
                  </h3>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                    <label className="text-foreground mb-1.5 block text-xs font-semibold">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="border-border placeholder:text-muted w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      placeholder="เช่น นัดทำสัญญา, ย้ายของ..."
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-border bg-surface rounded-xl border p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-87.5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <User size={16} />
                    ข้อมูลส่วนตัวผู้เช่า
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                        <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
                        ที่อยู่ตามทะเบียนบ้านตามบัตร ปชช
                      </label>
                      <div className="relative">
                        <MapPin className="text-muted pointer-events-none absolute top-3 left-3 h-4 w-4" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={3}
                          className="border-border placeholder:text-muted w-full resize-none rounded-lg border px-3 py-2 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                          placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-border bg-surface rounded-xl border p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                    <Lock size={16} />
                    บัญชีเข้าใช้งาน (App Login)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
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
                          className={inputWithIconClass}
                        />
                        {initialData?.userId && (
                          <p className="mt-1 text-[10px] text-blue-500">
                            * สามารถแก้ไขอีเมลได้
                            หากผู้เช่าไม่ได้ใช้อีเมลเดิมแล้ว
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-foreground mb-1.5 block text-xs font-semibold">
                        รหัสผ่าน{" "}
                        <span className="text-muted font-normal">
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
        <div className="border-border bg-background flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border bg-surface text-foreground hover:bg-background cursor-pointer rounded-lg border px-5 py-2 text-sm font-medium transition-all active:scale-95"
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
