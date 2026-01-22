"use client";
import React, { useState, useEffect } from "react";
import RequestForm from "./RequestForm";
import RequestHistory from "./RequestHistory";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { MaintenanceRequest } from "@/features/tenant";
import { Wrench, History } from "lucide-react";

export default function MaintenanceContainer() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("history");
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchHistory = async (page = 1) => {
    setLoading(true);

    try {
      const response: any = await TenantService.getMyMaintenances({
        page: page,
        limit: meta.limit,
      });

      setRequests(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(1);
    }
  }, [activeTab]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แจ้งซ่อมบำรุง</h1>
        <p className="mt-1 text-sm text-gray-500">
          แจ้งปัญหาที่เกิดขึ้นภายในห้องพัก หรือติดตามสถานะการซ่อม
        </p>
      </div>
      <div className="mb-6 inline-flex w-full gap-5 rounded-xl bg-gray-100/80 p-1.5 sm:w-auto">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none ${activeTab === "create" ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"}`}
        >
          <Wrench className="h-4 w-4" />
          แจ้งเรื่องใหม่
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"}`}
        >
          <History className="h-4 w-4" />
          ประวัติการแจ้ง
        </button>
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "create" ? (
          <RequestForm onSuccess={() => setActiveTab("history")} />
        ) : (
          <RequestHistory
            requests={requests}
            meta={meta}
            loading={loading}
            onPageChange={fetchHistory}
            onRefreshNeeded={() => fetchHistory(meta.page)}
          />
        )}
      </div>
    </div>
  );
}
