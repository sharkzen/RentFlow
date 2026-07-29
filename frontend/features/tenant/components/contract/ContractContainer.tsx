"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { TenantInfoCard } from "./TenantInfoCard";
import { FinancialCard } from "./FinancialCard";
import { DormitoryCard } from "./DormitoryCard";
import { PaymentChannelCard } from "./PaymentChannelCard";
import { ShieldCheck, FileText } from "lucide-react";
import { TenantContractDetail } from "@/features/tenant";
import LoadingPage from "@/lib/ui/layout/LoadingPage";

export default function ContractContainer() {
  const [tenantData, setTenantData] = useState<TenantContractDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadContractDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TenantService.getContractDetail();

      if (isMountedRef.current) setTenantData(data);
    } catch (error) {
      console.error("Failed to load contract:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadContractDetail();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadContractDetail]);

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingPage />
      </div>
    );

  if (!tenantData)
    return (
      <div className="text-muted flex h-[80vh] flex-col items-center justify-center">
        <ShieldCheck size={64} strokeWidth={1} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">
          ไม่พบข้อมูลสัญญาเช่าที่เปิดใช้งานอยู่
        </p>
      </div>
    );

  return (
    <div className="">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-6 flex items-center gap-2 text-blue-600">
          <FileText size={18} />
          <h1 className="text-foreground text-xl font-bold">สัญญาเช่าของฉัน</h1>
          <span className="ml-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200">
            ใช้งานอยู่
          </span>
        </div>
        <div className="space-y-5">
          <DormitoryCard tenant={tenantData} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <FinancialCard tenant={tenantData} />
            </div>
            <div className="space-y-5">
              <PaymentChannelCard tenant={tenantData} />
              <TenantInfoCard tenant={tenantData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
