"use client";
import React from "react";
import { useAuth } from "@/context/AuthProvider";
import LoadingPage from "@/components/layout/LoadingPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && user.role !== "TENANT") {
      router.push("/");
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (user?.status === "BANNED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            ไม่สามารถเข้าใช้งานได้
          </h3>
          <p className="mb-8 text-gray-500">
            บัญชีของคุณถูกระงับ <br />
            กรุณาติดต่อเจ้าของหอพักเพื่อตรวจสอบข้อมูล
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
