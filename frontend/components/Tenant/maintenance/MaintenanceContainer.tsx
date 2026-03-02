"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RequestForm from "./RequestForm";
import RequestHistory from "./RequestHistory";
import { TenantService } from "@/features/tenant/services/tenant.service";
import { MaintenanceRequest } from "@/features/tenant";
import { Wrench, History } from "lucide-react";

const TABS = [
  {
    id: "create",
    label: "แจ้งเรื่องใหม่",
    icon: Wrench,
  },
  {
    id: "history",
    label: "ประวัติการแจ้ง",
    icon: History,
  },
] as const;

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
    <div className="mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          แจ้งซ่อมบำรุง / แจ้งเรื่อง
        </h1>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          แจ้งปัญหาที่เกิดขึ้นภายในห้องพัก หรือติดตามสถานะการซ่อมได้ที่นี่
        </p>
      </div>

      <div className="relative mb-8 flex w-full rounded-2xl bg-gray-100 p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="relative flex flex-1 cursor-pointer items-center justify-center py-3 text-sm font-semibold transition-colors select-none focus:outline-none sm:text-base"
            >
              {isActive && (
                <motion.div
                  layoutId="maintenance-tab-indicator"
                  className="absolute inset-0 z-0 rounded-xl bg-white"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
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
