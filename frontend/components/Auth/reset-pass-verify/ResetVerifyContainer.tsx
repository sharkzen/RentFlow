"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import Link from "next/link";

import {
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-in fade-in zoom-in-95 w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
    <div className="p-8 sm:p-10">{children}</div>
  </div>
);

const HeaderIcon = ({ icon: Icon, colorClass, bgClass }: any) => (
  <div
    className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${bgClass} transition-transform duration-500 hover:scale-110`}
  >
    <Icon className={`h-8 w-8 ${colorClass}`} />
  </div>
);

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setIsTokenInvalid(true);
      setErrorMessage("ไม่พบ Token หรือลิงก์ไม่ถูกต้อง");
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        if (authService.verifyResetToken) {
          await authService.verifyResetToken(token);
        }

        setIsVerifying(false);
      } catch (err: any) {
        setIsTokenInvalid(true);
        const msg = err.response?.data?.message;

        if (msg === "INVALID_OR_EXPIRED_TOKEN") {
          setErrorMessage("ลิงก์หมดอายุหรือใช้งานไปแล้ว กรุณาขอใหม่");
        } else {
          setErrorMessage("ลิงก์ไม่ถูกต้องหรือเกิดข้อผิดพลาด");
        }

        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validateInput = () => {
    if (password.length < 6) {
      return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    }

    if (/[^\x20-\x7E]/.test(password)) {
      return "รหัสผ่านต้องเป็นภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น (ห้ามใช้ภาษาไทย)";
    }

    if (!/[a-zA-Z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว";
    }

    if (password !== confirmPassword) {
      return "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInput();

    if (validationError) {
      setErrorMessage(validationError);
      setStatus("error");
      return;
    }

    if (!token) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await authService.resetPassword(token, password);
      setStatus("success");

      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      const msg = err.response?.data?.message;

      if (msg === "INVALID_OR_EXPIRED_TOKEN") {
        setIsTokenInvalid(true);
        setErrorMessage("ลิงก์หมดอายุหรือใช้งานไปแล้ว กรุณาขอใหม่");
      } else {
        setErrorMessage(msg || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    }
  };

  if (isVerifying) {
    return (
      <CardContainer>
        <div className="flex flex-col items-center py-8">
          <Loader2 className="mb-6 h-12 w-12 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            กำลังตรวจสอบ...
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            กรุณารอสักครู่ ระบบกำลังยืนยันความถูกต้องของลิงก์
          </p>
        </div>
      </CardContainer>
    );
  }

  if (isTokenInvalid) {
    return (
      <CardContainer>
        <HeaderIcon
          icon={AlertCircle}
          bgClass="bg-red-50"
          colorClass="text-red-500"
        />
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            ลิงก์ใช้งานไม่ได้
          </h2>
          <p className="mb-8 leading-relaxed text-slate-500">
            {errorMessage ||
              "ลิงก์สำหรับรีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรืออาจจะหมดอายุแล้ว"}
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
          >
            ขอลิงก์รีเซ็ตรหัสผ่านใหม่
          </Link>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </CardContainer>
    );
  }

  if (status === "success") {
    return (
      <CardContainer>
        <HeaderIcon
          icon={CheckCircle2}
          bgClass="bg-green-50"
          colorClass="text-green-600"
        />
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            เปลี่ยนรหัสผ่านสำเร็จ!
          </h2>
          <p className="mb-8 leading-relaxed text-slate-500">
            รหัสผ่านของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว <br />
            ระบบกำลังพาท่านไปหน้าเข้าสู่ระบบ...
          </p>
          <div className="my-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer>
      <div className="mb-8 text-center">
        <HeaderIcon
          icon={ShieldCheck}
          bgClass="bg-blue-50"
          colorClass="text-blue-600"
        />
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          ตั้งรหัสผ่านใหม่
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          กรุณากรอกรหัสผ่านใหม่ที่ปลอดภัยและจดจำได้ง่าย
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              รหัสผ่านใหม่
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-12 pl-11 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${password.length >= 6 ? "bg-green-500" : "bg-slate-300"}`}
                ></span>
                <span>อย่างน้อย 6 ตัวอักษร</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${/[a-zA-Z]/.test(password) ? "bg-green-500" : "bg-slate-300"}`}
                ></span>
                <span>ต้องมีตัวอักษรภาษาอังกฤษ</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${password && !/[^\x20-\x7E]/.test(password) ? "bg-green-500" : "bg-slate-300"}`}
                ></span>
                <span>ห้ามใช้ภาษาไทย</span>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LockKeyhole className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-10 pl-11 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none sm:text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>
        {status === "error" && errorMessage && !isTokenInvalid && (
          <div className="animate-in slide-in-from-top-2 fade-in rounded-xl border border-red-100 bg-red-50/50 p-4">
            <div className="flex">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  เกิดข้อผิดพลาด
                </h3>
                <div className="mt-1 text-sm text-red-600">{errorMessage}</div>
              </div>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="group relative flex w-full cursor-pointer justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:translate-y-0 disabled:cursor-wait disabled:bg-blue-400 disabled:shadow-none"
        >
          {status === "loading" ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังบันทึก...</span>
            </div>
          ) : (
            <span>ยืนยันการเปลี่ยนรหัสผ่าน</span>
          )}
        </button>
      </form>
      <div className="mt-8 border-t border-slate-100 pt-6 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>กลับไปหน้าเข้าสู่ระบบ</span>
        </Link>
      </div>
    </CardContainer>
  );
}

export default function ResetPasswordContainer() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>
      <div className="pointer-events-none absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-blue-100/40 blur-[100px]"></div>
      <div className="pointer-events-none absolute top-[20%] -right-[10%] h-[40%] w-[40%] rounded-full bg-purple-100/30 blur-[100px]"></div>
      <div className="relative z-10 flex w-full justify-center">
        <Suspense
          fallback={
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
