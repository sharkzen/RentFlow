"use client";
import React, { useState } from "react";
import Link from "next/link";
import { authService } from "@/features/auth/services/auth.service";
import {
  KeyRound,
  CheckCircle2,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ForgotPasswordContainer() {
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      await authService.forgotPassword(email);
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(
        error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl transition-all">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            ส่งลิงก์เรียบร้อยแล้ว
          </h2>
          <p className="mb-8 leading-relaxed text-slate-500">
            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่
            <br />
            <span className="font-medium text-slate-900">{email}</span>
            <br />
            กรุณาตรวจสอบกล่องจดหมายของคุณ
          </p>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 text-sm text-slate-500 transition-colors hover:text-blue-600"
          >
            ไม่ได้ระบุอีเมลนี้? ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <div className="w-full max-w-110 space-y-8 rounded-2xl border border-slate-100 bg-white p-10 shadow-2xl transition-all">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
            <KeyRound className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            ลืมรหัสผ่าน?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            ไม่ต้องกังวล เพียงกรอกอีเมลที่ลงทะเบียนไว้{" "}
            <br className="hidden sm:block" />
            เราจะส่งลิงก์เพื่อตั้งค่ารหัสผ่านใหม่ให้คุณ
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  className="block w-full rounded-lg border border-slate-300 py-3 pr-3 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          {status === "error" && (
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
            disabled={status === "loading"}
            className="group relative flex w-full cursor-pointer justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-wait disabled:bg-blue-300"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <span>ส่งลิงก์ยืนยัน</span>
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
