// AnnouncementList.tsx
import React from "react";

interface AnnouncementListProps {
  data: any[]; // แนะนำให้สร้าง Type/Interface ให้ตรงกับโครงสร้างข้อมูลจากหลังบ้าน
  isLoading: boolean;
  onRefresh?: () => void;
}

export default function AnnouncementList({
  data,
  isLoading,
  onRefresh,
}: AnnouncementListProps) {
  if (isLoading) {
    return <div className="py-10 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">ยังไม่มีประกาศ</div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((announcement) => (
        <div
          key={announcement.id}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <h3 className="text-lg font-bold">{announcement.title}</h3>
          <p className="text-gray-600">{announcement.content}</p>
          <div className="mt-2 text-sm text-gray-400">
            คนอ่านแล้ว: {announcement.readCount} คน
          </div>
          {/* แสดงรูปภาพถ้ามี */}
          {announcement.images && announcement.images.length > 0 && (
            <div className="mt-2 flex gap-2">
              {announcement.images.map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt="ประกาศ"
                  className="h-24 w-24 rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
