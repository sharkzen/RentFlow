import React from "react";
import { Edit, Wind, Snowflake, Loader2, FileSearch } from "lucide-react";
import EditRoomDialog from "./EditRoomDialog";

interface RoomCardProps {
  rooms: any[];
  loading?: boolean;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  onRefresh?: () => void;
}

export default function RoomCard({
  rooms,
  loading,
  page,
  setPage,
  totalPages,
  totalItems,
  onRefresh,
}: RoomCardProps) {
  if (loading) {
    return (
      <div className="flex h-[65vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-500">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-600" />
          กำลังโหลดข้อมูลห้องพัก...
        </div>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex h-[65vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="text-center text-gray-400">
          <FileSearch className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <p>ไม่พบข้อมูลห้องพักในหอนี้</p>
        </div>
      </div>
    );
  }

  const itemsPerPage = 10;
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const gridTemplate = "grid-cols-[1.5fr_1.5fr_1.2fr_1.2fr_1fr_100px]";

  return (
    <div className="flex h-[65vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div
        className={`grid ${gridTemplate} gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-medium tracking-wider text-gray-500 uppercase`}
      >
        <div className="font-semibold">หมายเลขห้อง</div>
        <div className="font-semibold">สถานะ</div>
        <div className="font-semibold">ประเภท</div>
        <div className="font-semibold">ราคา/เดือน</div>
        <div className="font-semibold">ชั้น</div>
        <div className="font-semibold">จัดการ</div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto bg-white">
        <div className="min-w-335">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`group grid ${gridTemplate} items-center gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50`}
            >
              <div>
                <span className="text-sm font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                  {room.roomNumber}
                </span>
              </div>

              <div>
                <StatusBadge status={room.status} />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {room.type === "AIR" || room.isAir ? (
                  <>
                    <div className="rounded-full bg-blue-100 p-1 text-blue-600">
                      <Snowflake size={14} />
                    </div>
                    <span>แอร์</span>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-orange-100 p-1 text-orange-600">
                      <Wind size={14} />
                    </div>
                    <span>พัดลม</span>
                  </>
                )}
              </div>

              <div className="font-medium text-gray-900">
                ฿{room.basePrice?.toLocaleString() ?? 0}
              </div>

              <div className="text-sm text-gray-500">ชั้น {room.floor}</div>

              <div className="flex justify-end gap-2">
                <EditRoomDialog room={room} onSuccess={() => onRefresh?.()} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            แสดง{" "}
            <span className="font-medium text-gray-900">
              {startItem}-{endItem}
            </span>{" "}
            จากทั้งหมด{" "}
            <span className="font-medium text-gray-900">
              {totalItems.toLocaleString()}
            </span>{" "}
            ห้อง
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="text-xs font-medium text-gray-600">
              หน้า {page}/ {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    OCCUPIED: "bg-blue-50 text-blue-700 ring-blue-600/20",
    MAINTENANCE: "bg-red-50 text-red-700 ring-red-600/20",
  };

  const labels: Record<string, string> = {
    AVAILABLE: "ว่าง",
    OCCUPIED: "มีผู้เช่า",
    MAINTENANCE: "ปิดปรับปรุง",
  };

  const s = status?.toUpperCase() || "AVAILABLE";
  const currentStyle = styles[s] || styles.AVAILABLE;
  const label = labels[s] || s;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${currentStyle}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full bg-current`} />
      {label}
    </span>
  );
}
