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
  Megaphone,
  QrCode,
  Package,
} from "lucide-react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
      name: "ประกาศ",
      icon: <Megaphone size={20} />,
      href: "/owner/announcements",
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
      name: "เข้าระบบด้วย QR Code",
      icon: <QrCode size={20} />,
      href: "/owner/qr-scan-auth",
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
      name: "แพ็คเกจ",
      icon: <Package size={20} />,
      href: "/owner/billing",
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
        className={`border-border bg-surface fixed top-16.25 z-50 h-[calc(100vh-65px)] w-64 -translate-x-full overflow-hidden border-r transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : ""} /* Desktop (>960px): Sticky */ min-[960px]:sticky min-[960px]:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center text-white">
              <Image src={"/logo.png"} width={32} height={32} alt={"logo"} />
            </div>
            <div>
              <h1 className="text-foreground font-bold tracking-tight">Menu</h1>
              <p className="text-muted text-xs font-medium">Owner Panel</p>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-border flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-1">
              <p className="text-muted mb-2 px-4 text-xs font-semibold tracking-wider uppercase">
                Main Menu
              </p>
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${pathname === item.href ? "bg-background text-indigo-600" : "text-muted"} hover:bg-background group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:text-indigo-600 active:scale-[0.98]`}
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
