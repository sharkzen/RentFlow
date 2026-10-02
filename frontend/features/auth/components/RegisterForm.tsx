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
import InfoTooltip from "@/lib/ui/InfoTooltip";
import MapTutorialContent from "@/lib/ui/MapTutorialContent";
import Image from "next/image";

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

    if (!isValidText(form.address, 5, 500))
      newErrors.address = "กรุณากรอกที่อยู่";

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
    <div className="bg-background grid min-h-[calc(100vh-65px)] w-full min-[1420px]:grid-cols-2">
      <div className="relative hidden min-[1420px]:block">
        <Image
          src="/images/bg-main.jpg"
          alt="Apartment management"
          fill
          priority
          sizes="50vw"
          className="object-cover dark:opacity-50"
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
      <div className="bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {success ? (
            <FormSuccess />
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Image
                    src="/logo.png"
                    width={48}
                    height={48}
                    alt="RentFlow Logo"
                  />

                  <h1 className="text-foreground text-3xl font-extrabold sm:text-4xl">
                    Rent
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                      Flow
                    </span>
                  </h1>
                </div>

                <h2 className="text-foreground mt-6 text-xl font-semibold sm:text-2xl">
                  สร้างบัญชีเจ้าของหอพัก
                </h2>
              </div>
              <form
                onSubmit={handleSubmit}
                className="border-border bg-surface rounded-2xl border p-5 min-[1420px]:border-none sm:p-6 md:p-8"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <User className="text-muted h-4 w-4" />
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        placeholder="นาย สมชาย ใจใจ"
                        onChange={(e) =>
                          handleChange("fullName", e.target.value)
                        }
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.fullName ? "border-red-500" : "border-border"} `}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.fullName || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Mail className="text-muted h-4 w-4" />
                        อีเมล
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        placeholder="your_email@gmail.com"
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.email ? "border-red-500" : "border-border"} `}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.email || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Lock className="text-muted h-4 w-4" />
                        รหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          placeholder="••••••"
                          onChange={(e) =>
                            handleChange("password", e.target.value)
                          }
                          className={`bg-background w-full rounded-xl border px-4 py-3 pr-12 text-sm transition outline-none ${errors.password ? "border-red-500" : "border-border"} `}
                        />
                        <button
                          tabIndex={-1}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
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
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Lock className="text-muted h-4 w-4" />
                        ยืนยันรหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          placeholder="••••••"
                          onChange={(e) =>
                            handleChange("confirmPassword", e.target.value)
                          }
                          className={`bg-background w-full rounded-xl border px-4 py-3 pr-12 text-sm transition outline-none ${errors.confirmPassword ? "border-red-500" : "border-border"} `}
                        />
                        <button
                          tabIndex={-1}
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
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
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Home className="text-muted h-4 w-4" />
                        ชื่อหอพัก
                      </label>
                      <input
                        id="dormName"
                        type="text"
                        value={form.dormName}
                        placeholder="สุขใจ เพลส"
                        onChange={(e) =>
                          handleChange("dormName", e.target.value)
                        }
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.dormName ? "border-red-500" : "border-border"} `}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.dormName || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <MapPin className="text-muted h-4 w-4" />
                        ที่อยู่หอพัก
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={form.address}
                        placeholder="เช่น 123/45 ซอยสุขใจ ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000"
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.address ? "border-red-500" : "border-border"} `}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.address || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                        <MapPin className="text-muted h-4 w-4 shrink-0" />
                        ลิงก์ Google Map หรือ พิกัดที่ตั้ง
                        <InfoTooltip fullscreen>
                          <MapTutorialContent />
                        </InfoTooltip>
                      </label>
                      <input
                        id="mapUrl"
                        type="text"
                        value={form.mapUrl}
                        placeholder="วางลิงก์แมพ หรือกรอกพิกัด (เช่น 16.18807, 103.27974)"
                        onChange={(e) =>
                          handleChange(
                            "mapUrl",
                            extractMapUrlFromText(e.target.value),
                          )
                        }
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.mapUrl ? "border-red-500" : "border-border"} `}
                      />
                      <p className="min-h-4 text-xs text-red-600">
                        {errors.mapUrl || ""}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Phone className="text-muted h-4 w-4" />
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        id="phone"
                        type="text"
                        maxLength={10}
                        placeholder="เช่น 0812345678"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className={`bg-background w-full rounded-xl border px-4 py-3 text-sm transition outline-none ${errors.phone ? "border-red-500" : "border-border"} `}
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
                <p className="text-muted mt-4 text-center text-sm">
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
