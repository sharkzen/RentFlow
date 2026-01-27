"use client";
import { useState } from "react";

import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  BedDoubleIcon,
  ChevronRight,
  X,
  ReceiptText,
  User2,
  Menu,
} from "lucide-react";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function OwnerNavbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: "ภาพรวม",
      icon: <LayoutDashboard size={20} />,
      href: "/owner/dashboard",
    },
    {
      name: "จัดการหอพัก",
      icon: <Building2 size={20} />,
      href: "/owner/dorms",
    },
    {
      name: "จัดการห้องพัก",
      icon: <BedDoubleIcon size={20} />,
      href: "/owner/rooms",
    },
    {
      name: "จัดการผู้เช่า",
      icon: <Users size={20} />,
      href: "/owner/tenants",
    },
    {
      name: "จัดการบิล",
      icon: <ReceiptText size={20} />,
      href: "/owner/bills",
    },
    {
      name: "จัดการแจ้งซ่อม",
      icon: <Wrench size={20} />,
      href: "/owner/maintenance",
    },
    {
      name: "โปรไฟล์",
      icon: <User2 size={20} />,
      href: "/owner/profile",
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
        className={`fixed top-16.25 z-50 h-[calc(100vh-65px)] w-64 -translate-x-full overflow-hidden border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} /* Desktop (>960px): Sticky */ min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-slate-800">
                DormManager
              </h1>
              <p className="text-xs font-medium text-slate-400">Owner Panel</p>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-1">
              <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Main Menu
              </p>
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${pathname === item.href ? "bg-slate-50 text-indigo-600" : "text-slate-600"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98]`}
                >
                  <span className="stroke-current">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 min-[960px]:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
