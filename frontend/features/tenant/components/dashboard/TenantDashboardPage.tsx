"use client";
import React, { useEffect, useState } from "react";
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

  const fetchTenantDashboard = async () => {
    try {
      setLoading(true);
      const data = await TenantService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen w-full">
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            สวัสดี, คุณ{dashboard?.tenant.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 font-medium text-slate-500">
            <span className="flex items-center gap-1 rounded-full border border-slate-100 bg-white px-3 py-1 text-sm">
              <Building2 size={14} className="text-indigo-500" />
              {dashboard?.tenant.dormName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              ห้อง {dashboard?.tenant.roomNumber}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 space-y-5 xl:grid-cols-3 xl:gap-8 xl:space-y-0">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <h3 className="ml-1 text-sm font-bold tracking-wider text-slate-400 uppercase">
              สถานะการเงิน
            </h3>
            <BillStatusCard bill={dashboard?.bill} />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="ml-1 text-sm font-bold tracking-wider text-slate-400 uppercase">
              การใช้พลังงานเดือนนี้
            </h3>
            <UtilityUsageCard utilities={dashboard?.utilities} />
          </section>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-1">
          <section className="flex flex-col gap-3">
            <h3 className="ml-1 text-sm font-bold tracking-wider text-slate-400 uppercase">
              แจ้งซ่อม / บริการ
            </h3>
            <QuickStatsCard maintenance={dashboard?.maintenance} />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="ml-1 text-sm font-bold tracking-wider text-slate-400 uppercase">
              ประกาศ
            </h3>
            <RecentAnnouncements />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="ml-1 text-sm font-bold tracking-wider text-slate-400 uppercase">
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
      <div className="mb-2 h-10 w-1/3 rounded-lg bg-slate-200"></div>
      <div className="mb-10 h-6 w-1/4 rounded-lg bg-slate-200"></div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="h-64 rounded-3xl bg-slate-200"></div>
          <div className="h-40 rounded-3xl bg-slate-200"></div>
        </div>
        <div className="space-y-8">
          <div className="h-32 rounded-3xl bg-slate-200"></div>
          <div className="h-48 rounded-3xl bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
}
