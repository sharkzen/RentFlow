"use client";
import { useState } from "react";
import {
  User,
  Home,
  MapPin,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import useRegister from "@/features/auth/hooks/useRegister";
import type { OwnerRegisterFormData } from "@/features/auth/types";
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidMapLink,
  extractMapUrlFromText,
  isValidText,
} from "@/features/auth/validators";
import FormSuccess from "@/lib/ui/status/FormSuccess";
import { showBackendError } from "@/lib/backendError";
import InfoTooltip from "@/lib/ui/InfoTooltip";

export default function OwnerRegisterForm() {
  const mutation = useRegister();

  const [form, setForm] = useState<OwnerRegisterFormData>({
    fullName: "",
    dormName: "",
    address: "",
    mapUrl: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: keyof OwnerRegisterFormData, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field])
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
  };

  const onRegisterSuccess = () => {
    setSuccess(true);

    setForm({
      fullName: "",
      dormName: "",
      address: "",
      mapUrl: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      [key: string]: string;
    } = {};

    if (!isValidText(form.fullName, 3))
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง";

    if (!isValidText(form.dormName, 3))
      newErrors.dormName = "กรุณากรอกชื่อหอพัก";

    if (!isValidText(form.address, 5)) newErrors.address = "กรุณากรอกที่อยู่";

    if (!isValidEmail(form.email)) newErrors.email = "อีเมลไม่ถูกต้อง";

    if (!isValidPassword(form.password))
      newErrors.password = "รหัสผ่านต้องมีตัวอักษรและตัวเลขอย่างน้อย 6 ตัว";

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

    if (!isValidPhone(form.phone))
      newErrors.phone = "เบอร์โทรศัพท์ต้องมี 10 ตัวเลขและขึ้นต้น 0";

    if (!isValidMapLink(form.mapUrl))
      newErrors.mapUrl = "ลิงก์ Google Map ไม่ถูกต้อง";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await toast.promise(mutation.mutateAsync(form), {
        pending: "กำลังลงทะเบียน...",
        success: "ลงทะเบียนสำเร็จ",

        error: {
          render({ data }: any) {
            const errorMsg = data?.response?.data?.message || data?.message;

            if (errorMsg === "INVALID_MAP_URL") {
              return "ลิงก์แผนที่ใช้ไม่ได้ กรุณาเปลี่ยนลิงก์ (ลองใช้ลิงก์ปักหมุด)";
            }

            if (errorMsg === "EMAIL_ALREADY_EXISTS") {
              return "อีเมลนี้ถูกใช้งานไปแล้ว";
            }

            if (errorMsg === "DATA_ARE_NOT_VALID") {
              return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
            }

            return `เกิดข้อผิดพลาด: ${errorMsg || "โปรดลองใหม่อีกครั้ง"}`;
          },
        },
      });

      onRegisterSuccess();
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-65px)] w-full bg-white min-[1420px]:grid-cols-2">
      <div className="relative hidden min-[1420px]:block">
        <img
          src="/images/bg-main.jpg"
          alt="Apartment management"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex h-full flex-col p-12 text-white">
          <h2 className="text-5xl leading-tight font-bold">
            จัดการหอพักของคุณ
            <br />
            ได้ง่ายในที่เดียว
          </h2>
          <p className="mt-3 text-sm text-white/80">
            ห้องพัก • ผู้เช่า • รายได้ • แผนที่
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-gray-50 px-4 py-10 sm:px-6 sm:py-12 md:px-12 min-[1420px]:bg-white min-[1420px]:px-16">
        <div className="w-full max-w-2xl">
          {success ? (
            <FormSuccess />
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Rent
                  <span className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    Flow
                  </span>
                </h1>
                <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                  ลงทะเบียนหอพัก
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีเจ้าของหอพัก
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8 min-[1420px]:border-none min-[1420px]:shadow-none"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="h-4 w-4 text-gray-500" />
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(e) =>
                          handleChange("fullName", e.target.value)
                        }
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.fullName ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.fullName || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Mail className="h-4 w-4 text-gray-500" />
                        อีเมล
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.email ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.email || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Lock className="h-4 w-4 text-gray-500" />
                        รหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) =>
                            handleChange("password", e.target.value)
                          }
                          className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-12 text-sm transition outline-none ${errors.password ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.password || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Lock className="h-4 w-4 text-gray-500" />
                        ยืนยันรหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) =>
                            handleChange("confirmPassword", e.target.value)
                          }
                          className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-12 text-sm transition outline-none ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.confirmPassword || ""}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Home className="h-4 w-4 text-gray-500" />
                        ชื่อหอพัก
                      </label>
                      <input
                        id="dormName"
                        type="text"
                        value={form.dormName}
                        onChange={(e) =>
                          handleChange("dormName", e.target.value)
                        }
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.dormName ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.dormName || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        ที่อยู่หอพัก
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={form.address}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.address ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.address || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                        ลิงก์ Google Map
                        <Link
                          className="text-blue-500 underline"
                          href={"https://maps.google.com"}
                          target="_blank"
                        >
                          เปิด Map
                        </Link>
                        <InfoTooltip>
                          <p className="font-semibold text-gray-800">
                            วิธีคัดลอกลิงก์ตำแหน่งที่ถูกต้อง
                          </p>

                          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                            <li>
                              เปิด{" "}
                              <strong>Google Maps ผ่านเว็บเบราว์เซอร์</strong>
                              (เช่น Chrome, Edge หรือ Safari)
                              <span className="block text-xs text-gray-500">
                                ไม่แนะนำให้ทำผ่านแอป Google Maps
                              </span>
                            </li>

                            <li>
                              เลื่อนแผนที่ไปยังตำแหน่งของหอพักให้ตรงที่สุด
                            </li>

                            <li>
                              คลิกหรือกดค้างบนตำแหน่งหอพักจริง เพื่อ
                              <strong>ปักหมุด (Dropped Pin)</strong>
                              <span className="block text-xs text-gray-500">
                                อย่าค้นหาชื่อหอพักแล้วกดแชร์ทันที
                              </span>
                            </li>

                            <li>
                              เมื่อปักหมุดแล้ว ให้คัดลอกลิงก์จาก
                              <strong>แถบ URL ด้านบนของเบราว์เซอร์</strong>
                              แล้วนำมาวางในช่องนี้
                            </li>
                          </ol>

                          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-700">
                            <p className="font-medium">⚠️ ข้อควรระวัง</p>
                            <p className="mt-1 text-sm">
                              หากค้นหาชื่อหอพักแล้วกดแชร์ทันที Google Maps
                              อาจสร้างลิงก์ของสถานที่ที่อยู่ใกล้เคียง
                              หรือพิกัดที่ไม่ตรงกับตำแหน่งจริงของหอพัก
                              ทำให้ผู้เช่าเดินทางผิดตำแหน่งได้
                            </p>
                          </div>
                        </InfoTooltip>
                      </label>
                      <input
                        id="mapUrl"
                        type="text"
                        value={form.mapUrl}
                        onChange={(e) =>
                          handleChange(
                            "mapUrl",
                            extractMapUrlFromText(e.target.value),
                          )
                        }
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.mapUrl ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.mapUrl || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="h-4 w-4 text-gray-500" />
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        id="phone"
                        type="text"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition outline-none ${errors.phone ? "border-red-500" : "border-gray-300"} focus:bg-white focus:ring-4 focus:ring-blue-100`}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.phone || ""}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  disabled={mutation.isPending}
                  type="submit"
                  className={`${mutation.isPending ? "cursor-progress" : "cursor-pointer"} mt-6 w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-[0.98] disabled:opacity-60`}
                >
                  {mutation.isPending ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                  มีบัญชีแล้ว?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
