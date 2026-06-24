"use client";
import React from "react";

export default function AnnouncementList() {
  const mockAnnouncements = [
    {
      id: "1",
      title: "แจ้งทำความสะอาดแท็งก์น้ำประจำปี",
      dormitory: "ทดสอบ เพลส",
      type: "IMPORTANT",
      date: "24 มิ.ย. 2026",
      status: "ACTIVE",
      readCount: "45/50",
    },
    {
      id: "2",
      title: "โปรโมชั่นชวนเพื่อนมาเช่า รับส่วนลด 500 บาท",
      dormitory: "ทดสอบ เพลส",
      type: "NORMAL",
      date: "20 มิ.ย. 2026",
      status: "ACTIVE",
      readCount: "30/50",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="border-b border-gray-100 bg-gray-50/75 font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">หัวข้อประกาศ</th>
              <th className="px-6 py-4">หอพัก</th>
              <th className="px-6 py-4">ประเภท</th>
              <th className="px-6 py-4">วันที่สร้าง</th>
              <th className="px-6 py-4">การรับทราบ</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockAnnouncements.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.title}
                </td>
                <td className="px-6 py-4">{item.dormitory}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.type === "IMPORTANT" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {item.type === "IMPORTANT" ? "สำคัญ" : "ทั่วไป"}
                  </span>
                </td>
                <td className="px-6 py-4">{item.date}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {item.readCount}
                  </span>{" "}
                  คน
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${item.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    {item.status === "ACTIVE" ? "เผยแพร่" : "ปิดการมองเห็น"}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
