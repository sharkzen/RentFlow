import React from "react";
import { Edit, Trash2, Wind, Snowflake, Loader2 } from "lucide-react";
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
      <div className="flex h-[70vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm">กำลังโหลดข้อมูลห้องพัก...</span>
        </div>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-sm">ไม่พบข้อมูลห้องพักในหอนี้</span>
        </div>
      </div>
    );
  }

  const itemsPerPage = 10;
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const gridLayout =
    "grid grid-cols-12 gap-4 items-center px-6 py-4 whitespace-nowrap";

  return (
    <div className="flex h-[65vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-[1000px] flex-col">
          <div
            className={`flex-none border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase ${gridLayout}`}
          >
            <div className="col-span-2">หมายเลขห้อง</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2">ประเภท</div>
            <div className="col-span-2">ราคา/เดือน</div>
            <div className="col-span-2">ชั้น</div>
            <div className="col-span-2 text-right">จัดการ</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`border-b border-gray-50 transition-colors hover:bg-blue-50/30 ${gridLayout}`}
              >
                <div className="col-span-2">
                  <span className="text-base font-bold text-gray-800">
                    {room.roomNumber}
                  </span>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={room.status} />
                </div>
                <div className="col-span-2">
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
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">
                    ฿{room.basePrice?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  ชั้น {room.floor}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <EditRoomDialog room={room} onSuccess={() => onRefresh?.()} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-20 flex shrink-0 flex-col gap-4 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <span className="flex min-w-20 justify-center px-2 text-sm font-medium text-gray-700">
            หน้า {page}/ {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    OCCUPIED: "bg-blue-50 text-blue-700 border-blue-200",
    MAINTENANCE: "bg-red-50 text-red-700 border-red-200",
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${currentStyle}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full bg-current`} />
      {label}
    </span>
  );
}
