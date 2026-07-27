"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authService } from "@/features/auth/services/auth.service";
import OtpBoxInput from "@/features/auth/components/OtpBoxInput";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";

const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-110 space-y-8 rounded-2xl border border-slate-100 bg-white p-10 transition-all">
    {children}
  </div>
);

const HeaderIcon = ({
  icon: Icon,
  bgClass,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  colorClass: string;
}) => (
  <div
    className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${bgClass}`}
  >
    <Icon className={`h-7 w-7 ${colorClass}`} />
  </div>
);

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60;

type Step = "email" | "otp" | "password" | "done";

export default function ResetPasswordFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "locked">(
    "idle",
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== "otp") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      await authService.forgotPassword(email);
    } catch {
      // Intentionally ignored: anti-enumeration — always advance regardless of result.
    }

    setStatus("idle");
    setOtp("");
    setSecondsLeft(OTP_TTL_SECONDS);
    setStep("otp");
  };

  const handleResend = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      await authService.forgotPassword(email);
    } catch {
      // ignored, see handleEmailSubmit
    }

    setOtp("");
    setSecondsLeft(OTP_TTL_SECONDS);
    setStatus("idle");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await authService.verifyOtp(email, otp);
      setResetToken(res.resetToken);
      setStep("password");
      setStatus("idle");
    } catch (err) {
      const code = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;

      if (code === "TOO_MANY_ATTEMPTS") {
        setStatus("locked");
        setErrorMessage(
          "กรอกรหัส OTP ผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่อีกครั้ง",
        );
      } else {
        setStatus("error");
        setErrorMessage("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
      }
    }
  };

  const validatePassword = () => {
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePassword();

    if (validationError) {
      setErrorMessage(validationError);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await authService.resetPassword(resetToken, password);
      setStep("done");
      setStatus("idle");
    } catch (err) {
      const code = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setStatus("error");

      if (code === "INVALID_OR_EXPIRED_TOKEN") {
        setErrorMessage("เซสชันหมดอายุ กรุณากรอกรหัส OTP ใหม่อีกครั้ง");
        setStep("otp");
      } else {
        setErrorMessage("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    }
  };

  if (step === "done") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <CardContainer>
          <HeaderIcon
            icon={CheckCircle2}
            bgClass="bg-green-100"
            colorClass="text-green-600"
          />
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              เปลี่ยนรหัสผ่านสำเร็จ!
            </h2>
            <p className="mb-8 leading-relaxed text-slate-500">
              รหัสผ่านของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว
            </p>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </CardContainer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <CardContainer>
        {step === "email" && (
          <>
            <div className="text-center">
              <HeaderIcon
                icon={KeyRound}
                bgClass="bg-blue-50"
                colorClass="text-blue-600"
              />
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                ลืมรหัสผ่าน?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งรหัส OTP{" "}
                <br className="hidden sm:block" />
                เพื่อยืนยันและตั้งรหัสผ่านใหม่ให้คุณ
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
              <div>
                <label
                  htmlFor="email-address"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  อีเมลของคุณ
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-lg border border-slate-300 py-3 pr-3 pl-10 text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="group relative flex w-full cursor-pointer justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-wait disabled:bg-blue-300"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <span>ส่งรหัส OTP</span>
                )}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="text-center">
              <HeaderIcon
                icon={ShieldCheck}
                bgClass="bg-blue-50"
                colorClass="text-blue-600"
              />
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                กรอกรหัส OTP
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                เราได้ส่งรหัส 6 หลักไปที่
                <br />
                <span className="font-medium text-slate-900">{email}</span>
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
              <div>
                <label className="mb-3 block text-center text-sm font-medium text-slate-700">
                  รหัส OTP (6 หลัก)
                </label>
                <OtpBoxInput
                  length={OTP_LENGTH}
                  value={otp}
                  onChange={setOtp}
                  disabled={status === "locked"}
                  autoFocus
                />
                <p className="mt-3 text-center text-xs text-slate-400">
                  {secondsLeft > 0
                    ? `รหัสจะหมดอายุใน ${formatTime(secondsLeft)}`
                    : "รหัสอาจหมดอายุแล้ว กรุณาขอรหัสใหม่"}
                </p>
              </div>
              {(status === "error" || status === "locked") && (
                <div className="animate-fade-in-up rounded-md border border-red-100 bg-red-50 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        เกิดข้อผิดพลาด
                      </h3>
                      <div className="mt-1 text-sm text-red-700">
                        {errorMessage}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={
                  status === "loading" ||
                  status === "locked" ||
                  otp.length !== OTP_LENGTH
                }
                className="group relative flex w-full cursor-pointer justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <span>ยืนยันรหัส OTP</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={status === "loading"}
                className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 disabled:cursor-wait"
              >
                ไม่ได้รับรหัส? ส่งรหัส OTP ใหม่อีกครั้ง
              </button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
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
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
              {status === "error" && errorMessage && (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <div className="flex">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        เกิดข้อผิดพลาด
                      </h3>
                      <div className="mt-1 text-sm text-red-600">
                        {errorMessage}
                      </div>
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
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </Link>
        </div>
      </CardContainer>
    </div>
  );
}
