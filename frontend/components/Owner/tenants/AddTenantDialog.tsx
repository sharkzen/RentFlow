"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Home,
  Save,
  Contact,
  Lock,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import { Rooms } from "@/features/room/types";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { TenantService } from "@/features/tenant/services/tenant.service";
import log from "@/lib/logger";
import { toast } from "react-toastify";
import { useScrollLock, useOnClickOutside } from "usehooks-ts";
import { getTenantErrorMessage } from "@/features/tenant/constants/error-messages";

interface AddTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dormId: string;
  onSuccess: () => void;
}

// ฟังก์ชันสำหรับหา "วันนี้" แบบ Local Date (แก้ปัญหา UTC)
const getTodayString = () => {
  const date = new Date();
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
}: AddTenantDialogProps) {
  useScrollLock(); // ล็อค scroll ของ body หลัก

  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<Rooms[]>([]);

  // --- State สำหรับ Custom Dropdown ---
  const [isRoomSelectOpen, setIsRoomSelectOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const roomSelectRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกข้างนอก (ใช้ Type Casting เพื่อแก้ TS Error)
  useOnClickOutside(roomSelectRef as RefObject<HTMLElement>, () =>
    setIsRoomSelectOpen(false),
  );
  // ----------------------------------

  // State สำหรับ Form Data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    idCard: "",
    roomId: "",
    moveInDate: getTodayString(), // ใช้วันที่แบบ Local
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
  });

  // Fetch ห้องว่าง
  useEffect(() => {
    if (isOpen && dormId) {
      const fetchRooms = async () => {
        try {
          const res = await DormService.getAvailableRooms(dormId);
          setRooms(res);
        } catch (error) {
          log.error("Failed to fetch rooms", error);
        }
      };
      fetchRooms();
    }
  }, [isOpen, dormId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function เลือกห้องจาก Custom Dropdown
  const handleSelectRoom = (roomId: string) => {
    setFormData((prev) => ({ ...prev, roomId }));
    setIsRoomSelectOpen(false);
    setRoomSearch("");
  };

  // Filter ห้องสำหรับ Search (เพิ่ม Optional chaining กันบั๊ก)
  const filteredRooms = rooms.filter(
    (room) =>
      room.roomNumber?.toLowerCase().includes(roomSearch.toLowerCase()) ||
      room.floor?.toString().includes(roomSearch),
  );

  // หาห้องที่ถูกเลือกเพื่อมาแสดงผลในปุ่ม
  const selectedRoomObj = rooms.find((r) => r.id === formData.roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Validate ฝั่ง Frontend ก่อนส่ง (Frontend Validation)
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
      await toast.promise(
        TenantService.createTenant({ ...formData, dormId: dormId }),
        {
          pending: "กำลังบันทึกข้อมูล...",
          success: "เพิ่มผู้เช่าเรียบร้อยแล้ว",
          error: {
            render({ data }: any) {
              // ดึง error code จาก response ของ backend
              const errorResponse = data?.response?.data;
              const code = errorResponse?.code;

              // ใช้ Helper Function แปลงเป็นภาษาไทย
              return getTenantErrorMessage(code, errorResponse?.message);
            },
          },
        },
      );

      // Success Actions
      onSuccess();
      onClose();

      // Reset Form (เรียกฟังก์ชัน reset หรือ set state ใหม่)
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
      roomId: "",
      moveInDate: new Date().toISOString().split("T")[0], // อย่าลืมแก้เป็น Local Time function ที่ผมให้ไปก่อนหน้านี้นะครับ
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              เพิ่มผู้เช่าใหม่
            </h2>
            <p className="text-xs text-gray-500">
              กรอกข้อมูลเพื่อสร้างบัญชีและสัญญาเช่า
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <form
            id="add-tenant-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Section 1: ข้อมูลสัญญาและห้องพัก */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                <Home size={16} /> ข้อมูลการเช่า
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* --- Custom Room Select Start --- */}
                <div ref={roomSelectRef} className="relative z-20">
                  {" "}
                  {/* z-20 เพื่อให้ลอยเหนือ field อื่น */}
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    เลือกห้องพัก <span className="text-red-500">*</span>
                  </label>
                  {/* ปุ่ม Trigger Dropdown */}
                  <button
                    type="button"
                    onClick={() => setIsRoomSelectOpen(!isRoomSelectOpen)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-indigo-200 focus:outline-none ${
                      formData.roomId
                        ? "border-indigo-200 bg-indigo-50/50 text-indigo-900"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    <span className="truncate">
                      {selectedRoomObj
                        ? `ห้อง ${selectedRoomObj.roomNumber} (ชั้น ${selectedRoomObj.floor}) - ${selectedRoomObj.basePrice.toLocaleString()} บ.`
                        : "-- เลือกห้องพัก --"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`ml-2 transition-transform ${isRoomSelectOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {/* Dropdown Menu */}
                  {isRoomSelectOpen && (
                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/5">
                      <div className="sticky top-0 border-b border-gray-100 bg-gray-50 p-2">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute top-2.5 left-3 text-gray-400"
                          />
                          <input
                            type="text"
                            autoFocus
                            placeholder="ค้นหาเลขห้อง หรือ ชั้น..."
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white py-2 pr-3 pl-9 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <ul className="max-h-60 overflow-y-auto py-1">
                        {filteredRooms.length > 0 ? (
                          filteredRooms.map((room) => (
                            <li
                              key={room.id}
                              onClick={() => handleSelectRoom(room.id)}
                              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 ${
                                formData.roomId === room.id
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-gray-700"
                              }`}
                            >
                              <div>
                                <div className="font-semibold">
                                  ห้อง {room.roomNumber}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ชั้น {room.floor} •{" "}
                                  {room.type === "AIR" ? "แอร์" : "พัดลม"}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                  ฿{room.basePrice.toLocaleString()}
                                </span>
                                {formData.roomId === room.id && (
                                  <Check
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                )}
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-8 text-center text-xs text-gray-400">
                            {rooms.length === 0
                              ? "ไม่มีห้องว่าง"
                              : "ไม่พบห้องที่ค้นหา"}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {rooms.length === 0 && !isLoading && (
                    <p className="mt-1 text-xs text-red-500">
                      ไม่พบห้องว่างในหอพักนี้
                    </p>
                  )}
                </div>
                {/* --- Custom Room Select End --- */}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    วันที่เข้าพัก (Move In){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      name="moveInDate"
                      value={formData.moveInDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนอื่นๆ (Section 2-4) เหมือนเดิมครับ... */}
            {/* ผมย่อไว้เพื่อให้โค้ดกระชับ แต่นำส่วนเดิมมาต่อได้เลย */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                <User size={16} /> ข้อมูลส่วนตัวผู้เช่า
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    ชื่อจริง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="ระบุชื่อจริง"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="ระบุนามสกุล"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="08x-xxx-xxxx"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    เลขบัตรประชาชน
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="idCard"
                      value={formData.idCard}
                      onChange={handleChange}
                      placeholder="เลข 13 หลัก"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                <Lock size={16} /> บัญชีเข้าใช้งาน (User Account)
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    อีเมล (ใช้สำหรับ Login){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="user@example.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="xxxxxxx"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                <Contact size={16} /> ข้อมูลอื่นๆ
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    ชื่อผู้ติดต่อฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    เบอร์โทรผู้ติดต่อฉุกเฉิน
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="เช่น นัดทำสัญญาเพิ่มเติม, ย้ายของเข้าวันที่..."
                  />
                </div>
              </div>
            </div>

            {/* เพิ่ม padding ล่างสุด เพื่อกัน Dropdown โดนบัง */}
            <div className="pb-32"></div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            disabled={isLoading}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:bg-indigo-400"
          >
            <Save size={18} />
            {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}
