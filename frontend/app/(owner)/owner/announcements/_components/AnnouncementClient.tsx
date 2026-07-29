"use client";
import React, { useState, useEffect } from "react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import AnnouncementList from "./AnnouncementList";
import { Plus, Megaphone, BellOff, Building2, Filter } from "lucide-react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { CustomSelect } from "@/lib/ui/CustomSelect";
import LoadingPage from "../loading";
import { is } from "date-fns/locale";

const TYPE_OPTIONS = [
  {
    value: "ALL",
    label: "ทุกประเภท",
  },
  {
    value: "NORMAL",
    label: "ทั่วไป (Normal)",
  },
  {
    value: "IMPORTANT",
    label: "สำคัญ (Important)",
  },
  {
    value: "URGENT",
    label: "ด่วน (Urgent)",
  },
];

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

  if (isLoading || isDormsLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              ประกาศและข่าวสาร
            </h1>
            <p className="text-muted mt-1 text-sm">
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
        <div className="w-full sm:w-auto">
          <CustomSelect
            icon={<Building2 size={16} />}
            disabled={isDormsLoading || dorms.length === 0}
            placeholder={isDormsLoading ? "กำลังโหลด..." : "ไม่พบหอพัก"}
            options={dorms.map((dorm) => ({
              value: dorm.id,
              label: dorm.name,
            }))}
            value={selectedDormitory}
            onChange={setSelectedDormitory}
          />
        </div>
        <div className="w-full sm:w-auto">
          <CustomSelect
            icon={<Filter size={16} />}
            options={TYPE_OPTIONS}
            value={selectedType}
            onChange={setSelectedType}
          />
        </div>
      </div>
      {!isLoading && !isDormsLoading && filteredAnnouncements.length === 0 ? (
        <div className="border-border bg-background flex flex-col items-center justify-center rounded-3xl border border-dashed px-4 py-16 text-center">
          <div className="bg-surface mb-4 rounded-full p-4 shadow-sm">
            <BellOff size={32} className="text-muted" />
          </div>
          <h3 className="text-foreground text-lg font-bold">ยังไม่มีประกาศ</h3>
          <p className="text-muted mt-1 max-w-sm text-sm">
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
