import React, { useState } from "react";
import { Wind, Snowflake, Loader2, FileSearch, Pencil } from "lucide-react";
import EditRoomDialog from "./EditRoomDialog";
import LoadingPage from "@/lib/ui/layout/LoadingPage";

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
  const [editingRoom, setEditingRoom] = useState<any>(null);

  if (loading) {
    return (
      <div className="border-border bg-background flex h-[65vh] w-full items-center justify-center rounded-xl border">
        <LoadingPage />
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="border-border bg-background flex h-[65vh] w-full items-center justify-center rounded-xl border">
        <div className="text-muted text-center">
          <FileSearch className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <p>ไม่พบข้อมูลห้องพักในหอนี้</p>
        </div>
      </div>
    );
  }

  const itemsPerPage = 10;
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const gridTemplate = "grid-cols-[0.8fr_1.2fr_1.5fr_1.2fr_1.2fr_1.2fr_100px]";

  return (
    <>
      <div className="border-border bg-surface flex h-[65vh] w-full flex-col overflow-hidden rounded-xl border">
        <div
          className={`grid ${gridTemplate} border-border bg-background text-muted gap-4 border-b px-6 py-4 text-xs font-medium tracking-wider uppercase`}
        >
          <div className="font-semibold">ชั้น</div>
          <div className="font-semibold">หมายเลขห้อง</div>
          <div className="font-semibold">หอพัก</div>
          <div className="font-semibold">สถานะ</div>
          <div className="font-semibold">ประเภท</div>
          <div className="font-semibold">ราคา/เดือน</div>
          <div className="font-semibold">จัดการ</div>
        </div>
        <div className="custom-scrollbar bg-surface flex-1 overflow-auto">
          <div className="min-w-335">
            {rooms.map((room, index) => (
              <div
                key={room.id}
                onClick={() => setEditingRoom(room)}
                className={`group grid ${gridTemplate} border-border cursor-pointer items-center gap-4 border-b px-6 py-4 transition-colors last:border-0 hover:bg-indigo-50/40 dark:hover:bg-indigo-50/10 ${index % 2 === 0 ? "bg-surface" : "bg-background/60"}`}
              >
                <div className="text-muted text-sm font-medium">
                  ชั้น {room.floor}
                </div>
                <div>
                  <span className="text-foreground text-sm font-bold transition-colors group-hover:text-indigo-600">
                    {room.roomNumber}
                  </span>
                </div>
                <div className="text-muted text-sm font-medium">
                  {room.dormitory?.name || "-"}
                </div>
                <div>
                  <StatusBadge status={room.status} />
                </div>
                <div className="text-muted flex items-center gap-2 text-sm">
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
                <div className="text-foreground font-medium">
                  ฿{room.basePrice?.toLocaleString() ?? 0}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRoom(room);
                    }}
                    className="group/btn bg-surface text-muted ring-border relative cursor-pointer rounded-lg p-2 shadow-sm ring-1 transition-all hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200"
                    title="แก้ไขข้อมูลห้อง"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border bg-surface border-t px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted text-sm">
              แสดง{" "}
              <span className="text-foreground font-medium">
                {startItem}-{endItem}
              </span>{" "}
              จากทั้งหมด{" "}
              <span className="text-foreground font-medium">
                {totalItems.toLocaleString()}
              </span>{" "}
              ห้อง
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="border-border text-muted hover:bg-background rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-muted text-xs font-medium">
                หน้า {page}/ {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || totalPages === 0}
                className="border-border text-muted hover:bg-background rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
      {editingRoom && (
        <EditRoomDialog
          room={editingRoom}
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          onSuccess={() => {
            setEditingRoom(null);
            onRefresh?.();
          }}
        />
      )}
    </>
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
