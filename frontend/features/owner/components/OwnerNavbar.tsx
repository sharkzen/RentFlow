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
  Lock,
} from "lucide-react";
import {
  MANAGE_FEATURES,
  useOwnerBilling,
} from "@/features/billing/context/OwnerBillingContext";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function OwnerNavbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { billing } = useOwnerBilling();
  // เจ้าของหอที่ยังไม่มีแพ็คเกจ: เมนูงานจัดการล็อกด้วยกุญแจ กดแล้วไปเลือกแพ็คเกจทันที
  const manageLocked = !!billing?.enforced && billing.access === "locked";

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
          <div className="flex shrink-0 items-center gap-3 px-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center text-white">
              <Image src={"/logo.png"} width={32} height={32} alt={"logo"} />
            </div>
            <div>
              <h1 className="text-foreground font-bold tracking-tight">Menu</h1>
              <p className="text-muted text-xs font-medium">Owner Panel</p>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-border min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <nav className="space-y-1">
              <p className="text-muted mb-2 px-4 text-xs font-semibold tracking-wider uppercase">
                Main Menu
              </p>
              {menuItems.map((item) => {
                const feature = MANAGE_FEATURES.find((f) => f.prefix === item.href);
                const isLocked = manageLocked && !!feature;

                return (
                  <Link
                    key={item.name}
                    href={
                      isLocked ? `/owner/billing?from=${feature!.key}` : item.href
                    }
                    onClick={() => setSidebarOpen(false)}
                    title={isLocked ? "ต้องใช้แพ็คเกจ กดเพื่อเลือกแพ็คเกจ" : undefined}
                    aria-label={
                      isLocked ? `${item.name} (ล็อก ต้องใช้แพ็คเกจ)` : undefined
                    }
                    className={`${pathname === item.href ? "bg-background text-indigo-600" : "text-muted"} ${isLocked ? "opacity-70" : ""} hover:bg-background group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:text-indigo-600 active:scale-[0.98]`}
                  >
                    <span className="stroke-current">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {isLocked && (
                      <Lock size={15} className="shrink-0 text-amber-500" />
                    )}
                  </Link>
                );
              })}
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
