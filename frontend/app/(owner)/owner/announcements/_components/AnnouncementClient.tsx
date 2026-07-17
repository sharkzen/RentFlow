"use client";
import React, { useState, useEffect } from "react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import AnnouncementList from "./AnnouncementList";
import { Plus, Megaphone, BellOff } from "lucide-react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { DormService } from "@/features/dormitory/services/dorm.service";

export default function AnnouncementClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dorms, setDorms] = useState<any[]>([]);
  const [isDormsLoading, setIsDormsLoading] = useState(true);
  const [selectedDormitory, setSelectedDormitory] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        setIsDormsLoading(true);
        const result = await DormService.getDorm();
        const dormData = Array.isArray(result) ? result : result?.data || [];
        setDorms(dormData);

        if (dormData.length > 0) {
          setSelectedDormitory(dormData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch dormitories:", error);
      } finally {
        setIsDormsLoading(false);
      }
    };

    fetchDorms();
  }, []);

  const fetchAnnouncements = async () => {
    if (!selectedDormitory) return;

    try {
      setIsLoading(true);

      const result = await AnnouncementService.ownerGetAnnouncements({
        dormitoryId: selectedDormitory,
      });

      setAnnouncements(result.data || result);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedDormitory]);

  const filteredAnnouncements = announcements.filter((a: any) =>
    selectedType === "ALL" ? true : a.type === selectedType,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ประกาศและข่าวสาร
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              จัดการประกาศ แจ้งเตือน และข่าวสารสำหรับลูกบ้าน
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedDormitory}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={20} />
          <span>สร้างประกาศใหม่</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <select
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:bg-gray-50 sm:w-auto"
          value={selectedDormitory}
          onChange={(e) => setSelectedDormitory(e.target.value)}
          disabled={isDormsLoading || dorms.length === 0}
        >
          {isDormsLoading ? (
            <option value="">⏳ กำลังโหลด...</option>
          ) : dorms.length === 0 ? (
            <option value="">❌ ไม่พบหอพัก</option>
          ) : (
            dorms.map((dorm) => (
              <option key={dorm.id} value={dorm.id}>
                {dorm.name}
              </option>
            ))
          )}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none sm:w-auto"
        >
          <option value="ALL">ทุกประเภท</option>
          <option value="NORMAL">ทั่วไป (Normal)</option>
          <option value="IMPORTANT">สำคัญ (Important)</option>
          <option value="URGENT">ด่วน (Urgent)</option>
        </select>
      </div>
      {!isLoading && !isDormsLoading && filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-4 py-16 text-center">
          <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
            <BellOff size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">ยังไม่มีประกาศ</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            คุณยังไม่ได้สร้างประกาศใดๆ สำหรับหอพักนี้
            หรืออาจจะไม่มีประกาศในประเภทที่คุณเลือก
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedDormitory}
            className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            สร้างประกาศแรกเลย
          </button>
        </div>
      ) : (
        <AnnouncementList
          data={filteredAnnouncements}
          isLoading={isLoading || isDormsLoading}
          onRefresh={fetchAnnouncements}
        />
      )}
      {isModalOpen && (
        <CreateAnnouncementModal
          dormitoryId={selectedDormitory}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchAnnouncements}
        />
      )}
    </div>
  );
}
