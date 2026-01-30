"use client";
import React, { useEffect, useState } from "react";
import { AdminService } from "@/features/admin/services/admin.service";
import { DashboardData } from "@/features/admin";
import {
  Users,
  Building2,
  UserCheck,
  DoorOpen,
  LayoutDashboard,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { ActionCard } from "./ActionCard";
import { RecentUsersTable } from "./RecentUsersTable";
import { SystemInfoCard } from "./SystemInfoCard";
import { DashboardSkeleton } from "./DashboardSkeleton";

export default function DashboardContainer() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AdminService.getDashboard();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
        <div className="rounded-full bg-red-100 p-4">
          <LayoutDashboard className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-red-800">
          ไม่สามารถโหลดข้อมูลได้
        </h3>
        <p className="text-red-600">
          กรุณาลองใหม่อีกครั้ง หรือติดต่อฝ่ายเทคนิค
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
        >
          รีโหลดหน้าเว็บ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <LayoutDashboard className="h-7 w-7 text-blue-600" />
            ภาพรวมระบบ
          </h2>
          <p className="mt-1 pl-10 text-sm text-gray-500">
            สวัสดี Admin, นี่คือสรุปสถานะล่าสุดของระบบหอพัก
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="เจ้าของหอพักรออนุมัติ"
          value={data.actionRequired.pendingOwners}
          href="/admin/approvals"
          label="ตรวจสอบทันที"
          variant="warning"
        />
        <ActionCard
          title="หอพักรอตรวจสอบ (Pending)"
          value={data.actionRequired.pendingDormitories}
          href="/admin/dormitories"
          label="ไปที่รายการ"
          variant="warning"
        />
        <ActionCard
          title="แจ้งซ่อมคงค้าง (Open)"
          value={data.actionRequired.openMaintenance}
          href="#"
          label="ดูภาพรวม"
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ผู้ใช้งานทั้งหมด"
          value={data.overview.totalUsers}
          icon={Users}
          colorClass="bg-indigo-500"
          subText={`Owner: ${data.overview.totalOwners} | Tenant: ${data.overview.totalTenants}`}
        />
        <StatCard
          title="หอพักในระบบ"
          value={data.overview.totalDormitories}
          icon={Building2}
          colorClass="bg-emerald-500"
          subText="หอพักที่ลงทะเบียนแล้ว"
        />
        <StatCard
          title="ห้องพักทั้งหมด"
          value={data.overview.totalRooms}
          icon={DoorOpen}
          colorClass="bg-pink-500"
          subText="รวมทุกสถานะห้อง"
        />
        <StatCard
          title="ผู้ประกอบการ (Active)"
          value={data.overview.totalOwners}
          icon={UserCheck}
          colorClass="bg-amber-500"
          subText="ยืนยันตัวตนแล้ว"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentUsersTable users={data.recentUsers} />
        </div>

        <div className="h-full">
          <SystemInfoCard />
        </div>
      </div>
    </div>
  );
}
