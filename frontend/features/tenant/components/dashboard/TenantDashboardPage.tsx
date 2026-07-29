"use client";
import React, { useEffect, useRef, useState } from "react";
import BillStatusCard from "./BillStatusCard";
import UtilityUsageCard from "./UtilityUsageCard";
import QuickStatsCard from "./QuickStatsCard";
import ContactCard from "./ContactCard";
import RecentAnnouncements from "./RecentAnnouncements";
import { toast } from "react-toastify";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { TenantDashboardData } from "@/features/tenant";
import { Building2 } from "lucide-react";

export default function TenantDashboardPage() {
  const [dashboard, setDashboard] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchTenantDashboard = async () => {
    try {
      setLoading(true);
      const data = await TenantService.getDashboard();

      if (isMountedRef.current) setDashboard(data);
    } catch (error) {
      console.error(error);

      if (isMountedRef.current) toast.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchTenantDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen w-full">
      <div className="border-border mb-10 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            สวัสดี, คุณ{dashboard?.tenant.name}
          </h1>
          <div className="text-muted mt-2 flex items-center gap-2 font-medium">
            <span className="border-border bg-surface flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
              <Building2 size={14} className="text-indigo-500" />
              {dashboard?.tenant.dormName}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted">
              ห้อง {dashboard?.tenant.roomNumber}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 space-y-5 xl:grid-cols-3 xl:gap-8 xl:space-y-0">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <h3 className="text-muted ml-1 text-sm font-bold tracking-wider uppercase">
              สถานะการเงิน
            </h3>
            <BillStatusCard bill={dashboard?.bill} />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-muted ml-1 text-sm font-bold tracking-wider uppercase">
              การใช้พลังงานเดือนนี้
            </h3>
            <UtilityUsageCard utilities={dashboard?.utilities} />
          </section>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-1">
          <section className="flex flex-col gap-3">
            <h3 className="text-muted ml-1 text-sm font-bold tracking-wider uppercase">
              แจ้งซ่อม / บริการ
            </h3>
            <QuickStatsCard maintenance={dashboard?.maintenance} />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-muted ml-1 text-sm font-bold tracking-wider uppercase">
              ประกาศ
            </h3>
            <RecentAnnouncements />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-muted ml-1 text-sm font-bold tracking-wider uppercase">
              ข้อมูลหอพัก
            </h3>
            <ContactCard contact={dashboard?.contactInfo} />
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="bg-skeleton mb-2 h-10 w-1/3 rounded-lg"></div>
      <div className="bg-skeleton mb-10 h-6 w-1/4 rounded-lg"></div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="bg-skeleton h-64 rounded-3xl"></div>
          <div className="bg-skeleton h-40 rounded-3xl"></div>
        </div>
        <div className="space-y-8">
          <div className="bg-skeleton h-32 rounded-3xl"></div>
          <div className="bg-skeleton h-48 rounded-3xl"></div>
        </div>
      </div>
    </div>
  );
}
