"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  LayoutDashboard,
  Building2,
  Wrench,
  ChevronRight,
  X,
  ReceiptText,
  Zap,
  Package,
  FileText,
  User,
  LogOut,
  Menu,
  Megaphone,
} from "lucide-react";

export default function TenantNavbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainMenuItems = [
    {
      name: "ภาพรวม (Dashboard)",
      icon: <LayoutDashboard size={20} />,
      href: "/tenant/dashboard",
      description: "ดูยอดค้างจ่ายและประกาศ",
    },
    {
      name: "บิล & การชำระเงิน",
      icon: <ReceiptText size={20} />,
      href: "/tenant/bills",
      description: "ดูบิลและแจ้งโอน",
    },
    {
      name: "แจ้งซ่อม / แจ้งเรื่อง",
      icon: <Wrench size={20} />,
      href: "/tenant/maintenance",
      description: "แจ้งปัญหาภายในห้อง",
    },
    {
      name: "ประกาศ",
      icon: <Megaphone size={20} />,
      href: "/tenant/announcements",
      description: "ประกาศจากหอพัก",
    },
  ];

  const accountMenuItems = [
    {
      name: "สัญญาและห้องพัก",
      icon: <FileText size={20} />,
      href: "/tenant/contract",
    },
  ];

  return (
    <>
      {!sidebarOpen && (
        <button
          className="fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 min-[960px]:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      )}
      {sidebarOpen && (
        <button
          className="fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 min-[960px]:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Menu"
        >
          <X size={24} />
        </button>
      )}
      <aside
        className={`fixed top-16.25 z-50 h-[calc(100vh-65px)] w-72 -translate-x-full overflow-hidden border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} /* Desktop (>960px): Sticky */ min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">
                Menu
              </h1>
              <p className="text-xs font-medium text-slate-400">Tenant Panel</p>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 overflow-y-auto px-4 py-4">
            <nav className="mb-6 space-y-1">
              <p className="mb-3 px-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Menu
              </p>
              {mainMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]`}
                >
                  <span
                    className={`${pathname === item.href ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
            <nav className="space-y-1">
              <p className="mb-3 px-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Account
              </p>
              {accountMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]`}
                >
                  <span
                    className={`${pathname === item.href ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity min-[960px]:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
