import { useState, useRef, useMemo, RefObject } from "react";
import { Check, ChevronDown, Search, Home, User } from "lucide-react";
import { useOnClickOutside } from "usehooks-ts";

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
        className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-all ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200 hover:border-indigo-300"} ${disabled ? "cursor-not-allowed bg-gray-100 opacity-70" : "bg-white"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${selectedRoom ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
          >
            <Home size={14} />
          </div>
          <div className="flex flex-col truncate">
            {selectedRoom ? (
              <>
                <span className="text-sm font-bold text-gray-800">
                  ห้อง {selectedRoom.roomNumber}
                </span>
                {selectedRoom.tenantName && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <User size={10} />
                    <span className="truncate">{selectedRoom.tenantName}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">
                {isLoading ? "กำลังโหลด..." : "-- เลือกห้องพัก --"}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
          <div className="border-b border-gray-50 p-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="ค้นหาเลขห้อง..."
                className="w-full rounded-lg bg-gray-50 py-1.5 pr-3 pl-9 text-xs font-medium text-gray-700 transition-colors outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200"
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
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${value === room.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      ห้อง {room.roomNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      {room.tenantName || "-"}
                    </span>
                  </div>
                  {value === room.id && (
                    <Check size={16} className="text-indigo-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                ไม่พบห้องพัก
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
