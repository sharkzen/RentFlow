"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthProvider";
import useLogout from "@/features/auth/hooks/useLogout";
import { toast } from "react-toastify";
import { LayoutDashboard, LogOut, ChevronDown, Home } from "lucide-react";
import { Role } from "@/features/auth";
import Skeleton from "@/components/ui/Skeleton";
import log from "@/lib/logger";

export default function Header() {
  const { user, loading: authLoading, setUser } = useAuth();

  const logoutMutation = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const initial = user?.email?.charAt(0).toUpperCase() || "U";
  const username = user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);

    if (dropdownOpen) window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await toast.promise(logoutMutation.mutateAsync(), {
        pending: "กำลังออกจากระบบ...",

        error: {
          render({ data }: { data: any }) {
            const backendMsg = data?.response?.data?.message;
            return backendMsg
              ? `เกิดข้อผิดพลาด: ${backendMsg}`
              : "เกิดข้อผิดพลาดในการออกจากระบบ";
          },
        },
      });

      setUser(null);
      router.replace("/");
    } catch (error) {
      log.error("Logout error:", error);
    }
  };

  const dashbaordRole = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return "/owner/dashboard";
      case Role.TENANT:
        return "/tenant/dashboard";
      case Role.ADMIN:
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-[#F3F4F6]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center text-xl font-bold tracking-tight text-slate-900"
        >
          Rent
          <span className="ml-1 bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Flow
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {authLoading ? (
            <Skeleton className="h-8 w-32 rounded-full bg-white/50" />
          ) : (
            <>
              {!user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text px-4 py-2 text-sm font-medium text-transparent transition-colors hover:opacity-80"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95"
                  >
                    ลงทะเบียนหอพัก
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-3 shadow-sm transition-all hover:cursor-pointer hover:bg-white/80 hover:shadow-md active:scale-95"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-inner">
                      {initial}
                    </div>
                    <span className="hidden text-sm font-semibold text-slate-700 md:block">
                      {username}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 10,
                          scale: 0.95,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 10,
                          scale: 0.95,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: "easeOut",
                        }}
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5"
                      >
                        <div className="mb-1 border-b border-gray-100 px-3 py-2">
                          <p className="truncate text-xs font-medium text-slate-400">
                            บัญชีผู้ใช้
                          </p>
                          <p className="truncate text-sm font-bold text-slate-900">
                            {user.email}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Link
                            href={"/"}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <Home size={16} />
                            หน้าหลัก
                          </Link>
                          <Link
                            href={dashbaordRole(user.role)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                          >
                            <LayoutDashboard size={16} />
                            แดชบอร์ด
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:cursor-pointer hover:bg-red-50"
                          >
                            <LogOut size={16} />
                            ออกจากระบบ
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
