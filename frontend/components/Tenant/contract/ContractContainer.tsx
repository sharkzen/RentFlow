"use client";
import React, { useEffect, useState, useCallback } from "react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { TenantInfoCard } from "./TenantInfoCard";
import { FinancialCard } from "./FinancialCard";
import { DormitoryCard } from "./DormitoryCard";
import { ShieldCheck, FileText, MapPin } from "lucide-react";
import { TenantContractDetail } from "@/features/tenant";
import LoadingPage from "@/lib/ui/layout/LoadingPage";

export default function ContractContainer() {
  const [tenantData, setTenantData] = useState<TenantContractDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const loadContractDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TenantService.getContractDetail();
      setTenantData(data);
    } catch (error) {
      console.error("Failed to load contract:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContractDetail();
  }, [loadContractDetail]);

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingPage />
      </div>
    );

  if (!tenantData)
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-slate-400">
        <ShieldCheck size={64} strokeWidth={1} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">
          ไม่พบข้อมูลสัญญาเช่าที่เปิดใช้งานอยู่
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <FileText size={20} />
              <span className="text-sm font-bold tracking-wider uppercase">
                Active Contract
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
              สัญญาเช่าของฉัน
            </h1>
            <div className="mt-2 flex items-center gap-2 text-slate-500">
              <MapPin size={16} />
              <span>
                {tenantData.room.dormitory.name}— ห้อง{" "}
                {tenantData.room.roomNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <DormitoryCard tenant={tenantData} />
            <FinancialCard tenant={tenantData} />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <TenantInfoCard tenant={tenantData} />
          </div>
        </div>
      </div>
    </div>
  );
}
