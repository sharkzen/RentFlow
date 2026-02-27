"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    <div className="mx-auto w-full">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          แจ้งซ่อมบำรุง
        </h1>
        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          แจ้งปัญหาที่เกิดขึ้นภายในห้องพัก หรือติดตามสถานะการซ่อมได้ที่นี่
        </p>
      </div>

      <div className="relative mb-8 flex w-full rounded-2xl bg-gray-100/80 p-1.5">
        <button
          onClick={() => setActiveTab("create")}
          className="relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors duration-300 focus:outline-none sm:text-base"
        >
          {activeTab === "create" && (
            <motion.div
              layoutId="active-tab-indicator"
              className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-gray-200/50"
              transition={{
                type: "spring",
                bounce: 0,
                duration: 0.3,
              }}
            />
          )}
          <span
            className={`relative z-10 flex items-center gap-2 ${activeTab === "create" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
            แจ้งเรื่องใหม่
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className="relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors duration-300 focus:outline-none sm:text-base"
        >
          {activeTab === "history" && (
            <motion.div
              layoutId="active-tab-indicator"
              className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-gray-200/50"
              transition={{
                type: "spring",
                bounce: 0,
                duration: 0.3,
              }}
            />
          )}
          <span
            className={`relative z-10 flex items-center gap-2 ${activeTab === "history" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            ประวัติการแจ้ง
          </span>
        </button>
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
