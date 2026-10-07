"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Users,
  MapPin,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Star,
  FileCode2,
  Lock,
  BarChart3,
  Package,
  ReceiptText,
  Tag,
  Wallet,
} from "lucide-react";
import Image from "next/image";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: "แดชบอร์ด",
      href: routes.admin.dashboard,
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "อนุมัติผู้ประกอบการ",
      href: routes.admin.approvals,
      icon: <UserCheck size={20} />,
    },
    {
      name: "จัดการหอพัก",
      href: routes.admin.dormitories,
      icon: <Building2 size={20} />,
    },
    {
      name: "หอพักแนะนำ",
      href: routes.admin.featured,
      icon: <Star size={20} />,
    },
    {
      name: "รายงานรายได้",
      href: routes.admin.billingReports,
      icon: <BarChart3 size={20} />,
    },
    {
      name: "แพ็คเกจ (Plans)",
      href: routes.admin.plans,
      icon: <Package size={20} />,
    },
    {
      name: "คูปองและโปรโมชั่น",
      href: routes.admin.coupons,
      icon: <Tag size={20} />,
    },
    {
      name: "คำสั่งซื้อและสลิป",
      href: routes.admin.billingOrders,
      icon: <ReceiptText size={20} />,
    },
    {
      name: "ตั้งค่าการเงิน",
      href: routes.admin.billingSettings,
      icon: <Wallet size={20} />,
    },
    {
      name: "จัดการผู้ใช้งาน",
      href: routes.admin.users,
      icon: <Users size={20} />,
    },
    {
      name: "บัญชีที่ถูกล็อค",
      href: routes.admin.lockedUsers,
      icon: <Lock size={20} />,
    },
    {
      name: "สถานที่สำคัญ (Landmarks)",
      href: routes.admin.landmarks,
      icon: <MapPin size={20} />,
    },
    {
      name: "ฟีเจอร์ (Features)",
      href: routes.admin.features,
      icon: <Settings size={20} />,
    },
  ];

  return (
    <>
      {!sidebarOpen && (
        <button
          className="border-border bg-surface text-muted hover:bg-background fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border shadow-sm transition-all hover:text-indigo-600 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      )}
      {sidebarOpen && (
        <button
          className="border-border bg-surface text-muted hover:bg-background fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border shadow-sm transition-all hover:text-indigo-600 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Menu"
        >
          <X size={24} />
        </button>
      )}
      <aside
        className={`border-border bg-surface fixed top-16.25 z-50 flex h-[calc(100vh-65px)] w-64 -translate-x-full flex-col overflow-hidden border-r transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="border-border flex h-20 shrink-0 items-center gap-3 border-b px-6">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src={"/logo.png"} width={32} height={32} alt={"logo"} />
          </div>
          <div>
            <h1 className="text-foreground font-bold tracking-tight">
              Admin Panel
            </h1>
            <p className="text-muted text-xs font-medium">ระบบจัดการหอพัก</p>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-200 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-6">
          <p className="text-muted mb-2 px-4 text-xs font-bold tracking-wider uppercase">
            เมนูหลัก
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] ${isActive ? "bg-indigo-50 text-indigo-600" : "text-muted hover:bg-background hover:text-indigo-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`stroke-current ${isActive ? "text-indigo-600" : "text-muted group-hover:text-indigo-600"}`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="group text-muted hover:bg-background flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:text-indigo-600 active:scale-[0.98]"
            >
              <span className="text-muted stroke-current group-hover:text-indigo-600">
                <FileCode2 size={20} />
              </span>
              API Docs
            </a>
          </nav>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
