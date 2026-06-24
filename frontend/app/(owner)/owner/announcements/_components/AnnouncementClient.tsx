"use client";
import React, { useState } from "react";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import AnnouncementList from "./AnnouncementList";
import { Plus, Search, Filter } from "lucide-react";

export default function AnnouncementClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
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
          <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>ทั้งหมดทุกหอพัก</option>
            <option>ทดสอบ เพลส</option>
          </select>
          <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>ทุกประเภท</option>
            <option>ประกาศทั่วไป</option>
            <option>ด่วน/สำคัญ</option>
          </select>
        </div>
      </div>

      <AnnouncementList />

      {isModalOpen && (
        <CreateAnnouncementModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
