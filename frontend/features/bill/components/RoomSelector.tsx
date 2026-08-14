import { useState, useRef, useMemo, RefObject } from "react";
import { Check, ChevronDown, Search, Home, User } from "lucide-react";
import { useOnClickOutside } from "usehooks-ts";
import Link from "next/link";

interface RoomData {
  id: string;
  roomNumber: string;
  tenantName: string | null;
}

interface RoomSelectorProps {
  value: string;
  onChange: (roomId: string) => void;
  rooms: RoomData[];
  disabled?: boolean;
  isLoading?: boolean;
}

export default function RoomSelector({
  value,
  onChange,
  rooms,
  disabled,
  isLoading,
}: RoomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref as RefObject<HTMLElement>, () => setIsOpen(false));
  const selectedRoom = rooms.find((r) => r.id === value);

  const filteredRooms = useMemo(() => {
    return rooms.filter(
      (r) =>
        r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.tenantName &&
          r.tenantName.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [rooms, searchTerm]);

  const handleSelect = (roomId: string) => {
    onChange(roomId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-all ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "border-border hover:border-indigo-300"} ${disabled ? "bg-background cursor-not-allowed opacity-70" : "bg-surface"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${selectedRoom ? "bg-indigo-100 text-indigo-600" : "bg-background text-muted"}`}
          >
            <Home size={14} />
          </div>
          <div className="flex flex-col truncate">
            {selectedRoom ? (
              <>
                <span className="text-foreground text-sm font-bold">
                  ห้อง {selectedRoom.roomNumber}
                </span>
                {selectedRoom.tenantName && (
                  <div className="text-muted flex items-center gap-1 text-[10px]">
                    <User size={10} />
                    <span className="truncate">{selectedRoom.tenantName}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted text-sm">
                {isLoading ? "กำลังโหลด..." : "-- เลือกห้องพัก --"}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && !disabled && (
        <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border shadow-xl ring-1 ring-black/5">
          <div className="border-border border-b p-2">
            <div className="relative">
              <Search
                size={14}
                className="text-muted absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="ค้นหาเลขห้อง..."
                className="bg-background text-foreground focus:bg-surface w-full rounded-lg py-1.5 pr-3 pl-9 text-xs font-medium transition-colors outline-none focus:ring-1 focus:ring-indigo-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSelect(room.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${value === room.id ? "bg-indigo-50 text-indigo-700" : "text-foreground hover:bg-background"}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      ห้อง {room.roomNumber}
                    </span>
                    <span className="text-muted text-xs">
                      {room.tenantName || "-"}
                    </span>
                  </div>
                  {value === room.id && (
                    <Check size={16} className="text-indigo-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted py-4 text-center text-xs">
                ไม่พบห้องพักกรุณา
                <Link className="text-blue-500 underline" href="/owner/rooms">
                  สร้าง
                </Link>
                ห้องพักและมีคนพัก
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
