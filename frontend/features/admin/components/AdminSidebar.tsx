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
} from "lucide-react";

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
      name: "จัดการผู้ใช้งาน",
      href: routes.admin.users,
      icon: <Users size={20} />,
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
          className="fixed top-4 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      )}
      {sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Menu"
        >
          <X size={24} />
        </button>
      )}
      <aside
        className={`fixed top-16.25 z-50 h-[calc(100vh-65px)] w-64 -translate-x-full overflow-hidden border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-gray-50 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-slate-800">
              Admin Panel
            </h1>
            <p className="text-xs font-medium text-slate-400">
              ระบบจัดการหอพัก
            </p>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-200 flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <p className="mb-2 px-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`stroke-current ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"}`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                </Link>
              );
            })}
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
