"use client";
import { useState, useEffect } from "react";

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
  MapPin,
  Users,
  Coins,
  Power,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

import { toast } from "react-toastify";
import { useScrollLock } from "usehooks-ts";
import { TenantService } from "@/features/tenant/services/tenant.service";
import log from "@/lib/logger";
import DatePickerTh from "@/components/ui/DatePickerTh";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface EditTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | null;
  onSuccess: () => void;
}

export default function EditTenantDialog({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: EditTenantDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMoveOutOpen, setIsMoveOutOpen] = useState(false);
  const [isMovingOut, setIsMovingOut] = useState(false);
  const [initialData, setInitialData] = useState<any>();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    idCard: "",
    address: "",
    email: "",
    password: "",
    isActive: true,
    roomNumber: "",
    dormName: "",
    moveInDate: "",
    contractStartDate: "",
    contractEndDate: "",
    numberOfResidents: 1,
    securityDeposit: 0,
    advancePayment: 0,
    entranceFee: 0,
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && tenantId) {
      const fetchTenantData = async () => {
        setIsFetching(true);

        try {
          const data = await TenantService.getTenantById(tenantId);

          const mappedData = {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || "",
            idCard: data.idCard || "",
            address: data.address || "",
            email: data.email || "",
            password: "",
            isActive: data.user?.status === "ACTIVE",
            roomNumber: data.room?.roomNumber || "-",
            dormName: data.room?.dormitory?.name || "-",
            moveInDate: data.moveInDate ? data.moveInDate.split("T")[0] : "",
            contractStartDate: data.contractStartDate
              ? data.contractStartDate.split("T")[0]
              : "",
            contractEndDate: data.contractEndDate
              ? data.contractEndDate.split("T")[0]
              : "",
            numberOfResidents: data.numberOfResidents || 1,
            securityDeposit: data.securityDeposit || 0,
            advancePayment: data.advancePayment || 0,
            entranceFee: data.entranceFee || 0,
            emergencyContactName: data.emergencyContactName || "",
            emergencyContactPhone: data.emergencyContactPhone || "",
            notes: data.notes || "",
          };

          setFormData(mappedData);
          setInitialData(mappedData);
        } catch (error) {
          log.error("Failed to fetch tenant details", error);
          toast.error("ไม่สามารถดึงข้อมูลผู้เช่าได้");
          onClose();
        } finally {
          setIsFetching(false);
        }
      };

      fetchTenantData();
    }
  }, [isOpen, tenantId, onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "password") {
      const cleanValue = value.replace(/[ก-๙]/g, "");

      if (value !== cleanValue) {
        toast.warning("รหัสผ่านรองรับเฉพาะภาษาอังกฤษเท่านั้น");
      }

      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));

      return;
    }

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

  const handleToggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      isActive: !prev.isActive,
    }));
  };

  const getUpdateErrorMessage = (error: any) => {
    const errorData = error?.response?.data;
    const code = errorData?.code || "UNKNOWN_ERROR";

    switch (code) {
      case "EMAIL_ALREADY_EXISTS":
        return "อีเมลนี้มีผู้ใช้งานแล้วในระบบ";
      case "FORBIDDEN":
        return "คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้เช่ารายนี้";
      case "TENANT_NOT_FOUND":
        return "ไม่พบข้อมูลผู้เช่า (อาจถูกลบไปแล้ว)";
      case "TENANT_ALREADY_MOVED_OUT":
        return "ผู้เช่ารายนี้ย้ายออกไปแล้ว ไม่สามารถแก้ไขข้อมูลได้";
      case "MISSING_REQUIRED_FIELDS":
        return "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน";
      default:
        return errorData?.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    }
  };

  const handleMoveOutConfirm = async () => {
    if (!tenantId) return;

    setIsMovingOut(true);

    try {
      await toast.promise(TenantService.moveOut(tenantId), {
        pending: "กำลังดำเนินการแจ้งย้ายออก...",
        success: "แจ้งย้ายออกสำเร็จ สถานะห้องว่างแล้ว",

        error: {
          render({ data }: any) {
            const errorData = data?.response?.data;
            const code = errorData?.code;

            switch (code) {
              case "OUTSTANDING_BILLS_EXIST":
                return "ไม่สามารถย้ายออกได้: ผู้เช่ามียอดค้างชำระ (กรุณาเคลียร์บิลก่อน)";
              case "ALREADY_MOVED_OUT":
                return "ผู้เช่ารายนี้แจ้งย้ายออกไปแล้ว";
              case "FORBIDDEN":
                return "คุณไม่มีสิทธิ์ทำรายการนี้";
              case "TENANT_NOT_FOUND":
                return "ไม่พบข้อมูลผู้เช่า";
              case "room_not_found":
                return "ไม่พบข้อมูลห้องพัก";
              default:
                return `เกิดข้อผิดพลาด: ${errorData?.message || "โปรดลองใหม่อีกครั้ง"}`;
            }
          },
        },
      });

      setIsMoveOutOpen(false);
      onSuccess();
      onClose();
    } catch (error) {
      log.error("Move Out Error:", error);
    } finally {
      setIsMovingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) return;

    const password = formData.password.trim();
    const isPasswordChanged = password !== "";

    if (isPasswordChanged) {
      if (password.length < 6) {
        toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
      }

      if (/[ก-๙]/.test(password)) {
        toast.error(
          "รหัสผ่านห้ามใช้ภาษาไทย กรุณาใช้ภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ",
        );
        return;
      }

      const hasLetter = /[a-zA-Z]/.test(password);

      if (!hasLetter) {
        toast.error("รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว");
        return;
      }
    }

    const { password: pw1, ...dataToCompare } = formData;

    const { password: pw2, ...initialToCompare } = initialData || {};

    const isDataChanged =
      JSON.stringify(dataToCompare) !== JSON.stringify(initialToCompare);

    if (!isDataChanged && !isPasswordChanged) {
      toast.info("ไม่มีการเปลี่ยนแปลงข้อมูล", {
        autoClose: 2000,
      });

      onClose();
      return;
    }

    setIsLoading(true);

    try {
      await toast.promise(TenantService.updateTenant(tenantId, formData), {
        pending: "กำลังบันทึกการแก้ไข...",
        success: "อัปเดตข้อมูลเรียบร้อย",

        error: {
          render({ data }: any) {
            return `${getUpdateErrorMessage(data)}`;
          },
        },
      });

      onSuccess();
      onClose();
    } catch (error) {
      log.error("Update Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  useScrollLock();
  const inputBaseClass =
    "w-full h-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all placeholder:text-gray-400";
  const inputClass = `${inputBaseClass} px-3`;
  const inputWithIconClass = `${inputBaseClass} pl-10 pr-3`;
  const iconClass =
    "absolute top-3 left-3 h-4 w-4 text-gray-400 pointer-events-none";
  const readOnlyClass = `${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 transition-all duration-200">
      <ConfirmDialog
        isOpen={isMoveOutOpen}
        onClose={() => setIsMoveOutOpen(false)}
        onConfirm={handleMoveOutConfirm}
        title="ยืนยันการแจ้งย้ายออก"
        description={`คุณต้องการแจ้งย้ายออกผู้เช่า "${formData.firstName} ${formData.lastName}" ใช่หรือไม่? \nการกระทำนี้จะทำให้ห้องพักกลับมามีสถานะ "ว่าง" และไม่สามารถแก้ไขได้อีก`}
        confirmText="ยืนยันย้ายออก"
        cancelText="ยกเลิก"
        type="error"
        isLoading={isMovingOut}
      />
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              แก้ไขข้อมูลผู้เช่า
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isFetching
                ? "กำลังโหลดข้อมูล..."
                : `กำลังแก้ไขข้อมูลของ: ${formData.firstName} ${formData.lastName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex-1 overflow-y-auto bg-gray-50/30 p-2">
          {isFetching ? (
            <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
              <div className="flex space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 delay-75"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 delay-150"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-indigo-500 delay-300"></div>
              </div>
              <span className="text-sm font-medium text-gray-500">
                กำลังดึงข้อมูล...
              </span>
            </div>
          ) : (
            <form
              id="edit-tenant-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-87.5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                      <Home size={16} />
                      ข้อมูลห้องพัก (แก้ไขไม่ได้)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                          ห้องพักปัจจุบัน
                        </label>
                        <div className="relative">
                          <div className={`${readOnlyClass} flex items-center`}>
                            <span className="font-semibold text-gray-700">
                              ห้อง {formData.roomNumber}
                            </span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="truncate text-xs">
                              {formData.dormName}
                            </span>
                          </div>
                          <Lock className="absolute top-3 right-3 h-4 w-4 text-gray-400" />
                        </div>
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
                              type="number"
                              min="1"
                              name="numberOfResidents"
                              value={formData.numberOfResidents}
                              onChange={handleChange}
                              className={inputWithIconClass}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-55">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-600 uppercase">
                      <Coins size={16} />
                      ข้อมูลการเงิน
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          เงินประกันความเสียหาย
                        </label>
                        <div className="relative">
                          <span className="absolute top-2.5 left-3 font-sans text-sm text-gray-400">
                            ฿
                          </span>
                          <input
                            type="number"
                            min="0"
                            name="securityDeposit"
                            value={formData.securityDeposit}
                            onChange={handleChange}
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
                        placeholder="บันทึกข้อความ..."
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                            ชื่อจริง
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                            นามสกุล
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] lg:min-h-55">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
                      <Lock size={16} />
                      บัญชีเข้าใช้งาน (App Login)
                    </h3>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${formData.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            <Power size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              สถานะบัญชี
                            </p>
                            <p
                              className={`text-xs ${formData.isActive ? "text-green-600" : "text-red-500"}`}
                            >
                              {formData.isActive
                                ? "เปิดใช้งาน (Active)"
                                : "ระงับการใช้งาน (Banned)"}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={formData.isActive}
                            onChange={handleToggleStatus}
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          อีเมล (Login) <span className="text-red-500">*</span>
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
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          เปลี่ยนรหัสผ่านใหม่
                        </label>
                        <div className="relative">
                          <Lock className={iconClass} />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                            className={`${inputWithIconClass} pr-10`}
                          />

                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>

                        <p className="mt-1.5 text-[10px] text-gray-500">
                          * รหัสผ่านต้องมีอย่างน้อย{" "}
                          <span className="font-semibold text-indigo-600">
                            6 ตัวอักษร
                          </span>{" "}
                          และมี
                          <span className="font-semibold text-indigo-600">
                            ตัวอักษรภาษาอังกฤษ
                          </span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-orange-500">
                          * หากกรอกช่องนี้ รหัสผ่านเดิมจะถูกเปลี่ยนทันที
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div>
            {!isFetching && (
              <button
                disabled={!formData.isActive}
                type="button"
                onClick={() => setIsMoveOutOpen(true)}
                className={`group flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-all max-sm:text-xs ${!formData.isActive ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-red-100 active:scale-95"}`}
                title={
                  !formData.isActive
                    ? "ผู้เช่ารายนี้ไม่ได้อยู่ในสถานะเข้าพักปกติ"
                    : "แจ้งย้ายออก (Checkout)"
                }
              >
                <LogOut size={16} className="text-red-500" />
                <span className="max-sm:text-xs">
                  {!formData.isActive ? "ย้ายออกแล้ว" : "แจ้งย้ายออก"}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 max-sm:text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="edit-tenant-form"
              disabled={isLoading || isFetching}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 max-sm:text-xs"
            >
              <Save size={18} /> {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
