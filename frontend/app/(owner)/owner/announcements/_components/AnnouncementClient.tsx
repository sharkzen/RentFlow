"use client";
import React, { useState, useEffect } from "react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import AnnouncementList from "./AnnouncementList";
import { Plus, Search } from "lucide-react";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { DormService } from "@/features/dormitory/services/dorm.service"; // ✅ นำเข้า DormService (แก้ path ให้ตรงกับโปรเจกต์ของคุณ)

export default function AnnouncementClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State สำหรับประกาศ
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ State สำหรับหอพัก
  const [dorms, setDorms] = useState<any[]>([]);
  const [isDormsLoading, setIsDormsLoading] = useState(true);

  // State สำหรับ Filter
  const [selectedDormitory, setSelectedDormitory] = useState(""); // ✅ เริ่มต้นเป็นค่าว่าง รอข้อมูลจริง
  const [page, setPage] = useState(1);

  // ✅ ฟังก์ชันดึงข้อมูลรายชื่อหอพัก
  useEffect(() => {
    const fetchDorms = async () => {
      try {
        setIsDormsLoading(true);
        const result = await DormService.getDorm(); // หรือ getAllDroms() ขึ้นอยู่กับว่า Backend ให้ใช้อันไหน

        // ป้องกันกรณี result ไม่ใช่ Array โดยตรง (เช่นเป็น { data: [...] })
        const dormData = Array.isArray(result) ? result : result?.data || [];
        setDorms(dormData);

        // ✅ ตั้งค่าให้เลือกหอพักแรกเป็นค่าเริ่มต้นโดยอัตโนมัติ
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

  // ฟังก์ชันดึงข้อมูลประกาศ
  const fetchAnnouncements = async () => {
    if (!selectedDormitory) return; // ✅ ถ้ายังไม่มี ID หอพัก จะยังไม่ดึงข้อมูลประกาศ

    try {
      setIsLoading(true);
      const result = await AnnouncementService.ownerGetAnnouncements({
        dormitoryId: selectedDormitory,
        page: page,
        limit: 10,
      });

      setAnnouncements(result.data);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลประกาศใหม่ทุกครั้งที่ หอพัก หรือ หน้า เปลี่ยนแปลง
  useEffect(() => {
    fetchAnnouncements();
  }, [selectedDormitory, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประกาศ</h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการประกาศ ข่าวสาร และการแจ้งเตือนถึงลูกบ้าน
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedDormitory} // ✅ ปิดปุ่มถ้ายังไม่มีหอพัก
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          <span>สร้างประกาศใหม่</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหาหัวข้อประกาศ..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          {/* ✅ วนลูปแสดงข้อมูลหอพักจริง */}
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
            value={selectedDormitory}
            onChange={(e) => setSelectedDormitory(e.target.value)}
            disabled={isDormsLoading || dorms.length === 0}
          >
            {isDormsLoading ? (
              <option value="">กำลังโหลด...</option>
            ) : dorms.length === 0 ? (
              <option value="">ไม่พบหอพัก</option>
            ) : (
              dorms.map((dorm) => (
                <option key={dorm.id} value={dorm.id}>
                  {dorm.name}
                </option>
              ))
            )}
          </select>

          <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>ทุกประเภท</option>
            <option>ประกาศทั่วไป</option>
            <option>ด่วน/สำคัญ</option>
          </select>
        </div>
      </div>

      <AnnouncementList
        data={announcements}
        isLoading={isLoading || isDormsLoading}
        onRefresh={fetchAnnouncements}
      />

      {isModalOpen && (
        <CreateAnnouncementModal
          onClose={() => {
            setIsModalOpen(false);
            fetchAnnouncements();
          }}
          dormitoryId={selectedDormitory}
        />
      )}
    </div>
  );
}
