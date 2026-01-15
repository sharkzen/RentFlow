"use client";
import { Megaphone, ChevronRight } from "lucide-react";

export default function RecentAnnouncements() {
  const announcements = [
    {
      id: 1,
      title: "แจ้งกำหนดการล้างแท็งก์น้ำ",
      date: "14 ม.ค. 69",
      priority: "high",
    },
    {
      id: 2,
      title: "เปลี่ยนรหัสผ่านประตูคีย์การ์ดใหม่",
      date: "10 ม.ค. 69",
      priority: "normal",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Megaphone size={18} className="text-indigo-500" />
          ประกาศจากหอพัก
        </h3>
        <button className="text-xs font-medium text-indigo-600 hover:underline">
          ดูทั้งหมด
        </button>
      </div>
      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100"
          >
            <div className="flex gap-3">
              <div
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.priority === "high" ? "bg-red-500" : "bg-slate-300"}`}
              />
              <div>
                <p className="line-clamp-1 text-sm font-medium text-slate-700">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400">{item.date}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
