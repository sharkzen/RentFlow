"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  QrCode,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidEmail } from "@/features/auth/validators";
import useLogin from "@/features/auth/hooks/useLogin";
import { authService } from "../services/auth.service";
import { useAuth } from "@/lib/providers/AuthProvider";
import log from "@/lib/logger";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { setUser } = useAuth();

  const mutation = useLogin();
  const redirectParam = searchParams.get("redirect");
  const redirect = redirectParam ? decodeURIComponent(redirectParam) : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [qrState, setQrState] = useState<"idle" | "loading" | "error">("idle");
  const [qrErrorMessage, setQrErrorMessage] = useState("");

  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const token = searchParams.get("token");

    if (roomId && token) {
      setQrState("loading");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("roomId");
      params.delete("token");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState(null, "", newUrl);

      authService
        .loginWithQr({
          roomId,
          token,
        })
        .then(async (res) => {
          toast.success("เข้าสู่ระบบด้วย QR Code สำเร็จ!");
          const me = await authService.getMe();
          setUser(me);
          router.replace("/tenant/dashboard");
        })
        .catch((error) => {
          const backendErrorCode =
            error?.response?.data?.message || error?.message;
          setQrState("error");

          if (backendErrorCode === "INVALID_OR_EXPIRED_QR_CODE") {
            setQrErrorMessage(
              "QR Code นี้ไม่ถูกต้อง หมดอายุ หรือถูกระงับการใช้งาน",
            );
          } else if (backendErrorCode === "USER_NOT_FOUND_FOR_THIS_ROOM") {
            setQrErrorMessage("ไม่พบข้อมูลผู้เช่าที่กำลังใช้งานห้องนี้อยู่");
          } else if (backendErrorCode === "USER_ACCOUNT_SUSPENDED") {
            setQrErrorMessage("บัญชีผู้เช่านี้ถูกระงับการใช้งาน");
          } else {
            setQrErrorMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย QR Code");
          }

          toast.error("เข้าสู่ระบบด้วย QR Code ไม่สำเร็จ");
        });
    }
  }, [searchParams, router, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) newErrors.email = "กรุณากรอกอีเมล";
    else if (!isValidEmail(email)) newErrors.email = "อีเมลไม่ถูกต้อง";

    if (!password) newErrors.password = "กรุณากรอกรหัสผ่าน";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const errorMessages: Record<string, string> = {
        EMAIL_NOT_FOUND: "อีเมลไม่ถูกต้อง",
        INVALID_EMAIL_OR_PASSWORD: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        DATA_ARE_NOT_VALID: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        UNAUTHORIZED: "ไม่มีสิทธิ์เข้าใช้งาน",
        INTERNAL_SERVER_ERROR: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์",
      };

      try {
        const response = await toast.promise(
          mutation.mutateAsync({
            email,
            password,
          }),
          {
            pending: "กำลังเข้าสู่ระบบ...",
            success: "เข้าสู่ระบบสำเร็จ",

            error: {
              render({ data }: { data: any }) {
                const backendErrorCode =
                  data?.response?.data?.message || data?.message;
                return (
                  errorMessages[backendErrorCode] ||
                  "เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง"
                );
              },
            },
          },
        );

        const me = await authService.getMe();
        setUser(me);
        const safeRedirect =
          redirect && redirect.startsWith("/") ? redirect : null;

        if (safeRedirect) {
          router.replace(safeRedirect);
          return;
        }

        if (response.role === "OWNER" || response.role === "STAFF")
          router.replace("/owner/dashboard");
        else if (response.role === "TENANT")
          router.replace("/tenant/dashboard");
        else if (response.role === "ADMIN") router.replace("/admin/dashboard");
      } catch (error: any) {
        log.error("Login failed:", error);
      }
    }
  };

  return (
    <div className="grid h-[calc(100vh-65px)] w-full bg-white md:grid-cols-2">
      <div className="relative hidden md:block">
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
            อย่างมืออาชีพ
          </h2>
          <p className="mt-3 text-white/80">ห้องพัก • ผู้เช่า • รายได้</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 md:px-12 lg:px-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-10 text-5xl font-extrabold">
              Rent{" "}
              <span className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Flow
              </span>
            </h1>

            {qrState === "idle" && (
              <h2 className="text-xl font-semibold text-gray-800">
                เข้าสู่ระบบ
              </h2>
            )}
          </div>

          {qrState === "loading" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                กำลังตรวจสอบ QR Code...
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                โปรดรอสักครู่ ระบบกำลังนำคุณเข้าสู่แดชบอร์ด
              </p>
            </div>
          )}

          {qrState === "error" && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-red-800">
                ไม่สามารถเข้าสู่ระบบได้
              </h3>
              <p className="mb-6 text-sm text-red-600">{qrErrorMessage}</p>
              <button
                onClick={() => setQrState("idle")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปเข้าสู่ระบบด้วยอีเมล
              </button>
            </div>
          )}

          {qrState === "idle" && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-500" />
                    อีเมล
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);

                      if (errors.email)
                        setErrors((p) => ({
                          ...p,
                          email: undefined,
                        }));
                    }}
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
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (errors.password)
                          setErrors((p) => ({
                            ...p,
                            password: undefined,
                          }));
                      }}
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
                <button
                  disabled={mutation.isPending}
                  type="submit"
                  className={`${mutation.isPending ? "cursor-progress" : "hover:cursor-pointer"} mt-2 w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-[0.98] disabled:opacity-60`}
                >
                  {mutation.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
                <div className="flex justify-between pt-2 text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="text-blue-600 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                  <Link
                    href="/auth/register"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    ลงทะเบียนหอพัก
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
