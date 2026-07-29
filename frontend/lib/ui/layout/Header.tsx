"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/providers/AuthProvider";
import useLogout from "@/features/auth/hooks/useLogout";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Home,
  Sun,
  Moon,
} from "lucide-react";
import { Role } from "@/features/auth";
import Skeleton from "@/lib/ui/Skeleton";
import log from "@/lib/logger";
import Image from "next/image";

export default function Header() {
  const { user, loading: authLoading, setUser } = useAuth();

  const { resolvedTheme, setTheme } = useTheme();

  const [isMounted, setIsMounted] = useState(false);
  const logoutMutation = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const initial = user?.fullName?.charAt(0).toUpperCase() || "U";
  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<(HTMLElement | null)[]>([]);
  const menuId = useId();
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs = [
    {
      name: "เข้าสู่ระบบ",
      href: "/auth/login",
    },
    {
      name: "ลงทะเบียน",
      href: "/auth/register",
    },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const focusMenuItem = (index: number) => {
    const items = menuItemRefs.current.filter(Boolean);

    if (items.length === 0) return;

    const clamped = (index + items.length) % items.length;
    items[clamped]?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDropdownOpen(true);
      requestAnimationFrame(() => focusMenuItem(0));
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusMenuItem(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusMenuItem(index - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDropdownOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setDropdownOpen(false);
    }
  };

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
      setDropdownOpen(false);
      window.location.href = "/";
    } catch (error) {
      log.error("Logout error:", error);
    } finally {
      setDropdownOpen(false);
    }
  };

  const dashboardRole = (role: Role) => {
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

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    if (!("startViewTransition" in document)) {
      setTheme(nextTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Link href="/">
            <Image
              src={"/logoblack.png"}
              alt="logo"
              width={40}
              height={40}
              className="hidden dark:block md:dark:hidden"
            />
          </Link>
          <Link href="/">
            <Image
              src={"/logowhite.png"}
              alt="logo"
              width={40}
              height={40}
              className="block md:hidden dark:hidden"
            />
          </Link>
          <Link
            href="/"
            className={`text-foreground group flex items-center text-xl font-bold tracking-tight max-md:hidden ${user ? "max-[960px]:pl-10" : ""}`}
          >
            Rent
            <span className="ml-1 bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Flow
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {!isMounted || authLoading ? (
            <Skeleton className="bg-surface/50 h-8 w-32 rounded-full" />
          ) : (
            <>
              {!user ? (
                <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const isHovered = hoveredTab === tab.href;

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onMouseEnter={() => setHoveredTab(tab.href)}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="auth-tab-active"
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        {!isActive && isHovered && (
                          <motion.div
                            layoutId="auth-tab-hover"
                            className="absolute inset-0 rounded-full bg-gray-200 dark:bg-zinc-800"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative z-10 text-xs md:text-sm">
                          {tab.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    ref={triggerRef}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onKeyDown={handleTriggerKeyDown}
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                    aria-controls={menuId}
                    className="border-border bg-surface hover:bg-background flex items-center gap-2 rounded-full border p-1 pr-3 transition-all hover:cursor-pointer active:scale-95"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {initial}
                    </div>
                    <span className="text-foreground hidden text-sm font-semibold md:block">
                      {firstName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        id={menuId}
                        role="menu"
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
                        className="bg-surface border-border absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border"
                      >
                        <div className="border-border mb-1 border-b p-2 px-3 py-2">
                          <p className="text-muted truncate text-xs font-medium">
                            บัญชีผู้ใช้
                          </p>
                          <p className="text-foreground truncate text-sm font-bold">
                            {user.email}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Link
                            ref={(el) => {
                              menuItemRefs.current[0] = el;
                            }}
                            href={"/"}
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            onKeyDown={(e) => handleMenuKeyDown(e, 0)}
                            className="text-muted hover:bg-background focus:bg-background flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 focus:text-indigo-600 focus:outline-none"
                          >
                            <Home size={16} />
                            หน้าหลัก
                          </Link>
                          <Link
                            ref={(el) => {
                              menuItemRefs.current[1] = el;
                            }}
                            href={dashboardRole(user.role)}
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            onKeyDown={(e) => handleMenuKeyDown(e, 1)}
                            className="text-muted hover:bg-background focus:bg-background flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 focus:text-indigo-600 focus:outline-none"
                          >
                            <LayoutDashboard size={16} />
                            แดชบอร์ด
                          </Link>
                          <button
                            ref={(el) => {
                              menuItemRefs.current[2] = el;
                            }}
                            role="menuitem"
                            onClick={handleLogout}
                            onKeyDown={(e) => handleMenuKeyDown(e, 2)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:outline-none"
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
          {isMounted && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="สลับธีมสว่าง/มืด"
              className="border-border text-muted hover:bg-surface flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors active:scale-95"
            >
              {resolvedTheme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
