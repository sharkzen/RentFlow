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
import Image from "next/image";

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
          className="border-border bg-surface text-muted hover:bg-background fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all hover:text-indigo-600 min-[960px]:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      )}
      {sidebarOpen && (
        <button
          className="border-border bg-surface text-muted hover:bg-background fixed top-3 left-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all hover:text-indigo-600 min-[960px]:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Menu"
        >
          <X size={24} />
        </button>
      )}
      <aside
        className={`border-border bg-surface fixed top-16.25 z-50 h-[calc(100vh-65px)] w-72 -translate-x-full overflow-hidden border-r transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} /* Desktop (>960px): Sticky */ min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="border-border flex items-center gap-3 border-b px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center text-white">
              <Image src={"/logo.png"} width={32} height={32} alt={"logo"} />
            </div>
            <div>
              <h1 className="text-foreground text-lg font-bold tracking-tight">
                Menu
              </h1>
              <p className="text-muted text-xs font-medium">Tenant Panel</p>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-border flex-1 overflow-y-auto px-4 py-4">
            <nav className="mb-6 space-y-1.5">
              <p className="text-muted mb-3 px-4 text-xs font-bold tracking-wider uppercase">
                Menu
              </p>
              {mainMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-muted hover:bg-background hover:text-foreground"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]`}
                >
                  <span
                    className={`${pathname === item.href ? "text-indigo-600" : "text-muted group-hover:text-foreground"}`}
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
              <p className="text-muted mb-3 px-4 text-xs font-bold tracking-wider uppercase">
                Account
              </p>
              {accountMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-muted hover:bg-background hover:text-foreground"} group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]`}
                >
                  <span
                    className={`${pathname === item.href ? "text-indigo-600" : "text-muted group-hover:text-foreground"}`}
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
