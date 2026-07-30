"use client";
import { useState, useMemo } from "react";
import { Building2, Search, X, ChevronRight, Home } from "lucide-react";

interface Dorm {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dorms: Dorm[];
  onSelect: (dormId: string) => void;
}

const CARD_ACCENTS = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-sky-500",
];

export default function SelectDormModal({
  isOpen,
  onClose,
  dorms,
  onSelect,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const selectableDorms = useMemo(
    () => dorms.filter((d) => d.id !== "ALL"),
    [dorms],
  );

  const filteredDorms = useMemo(
    () =>
      selectableDorms.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [selectableDorms, searchTerm],
  );

  if (!isOpen) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 duration-150 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface animate-in fade-in zoom-in-95 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 duration-150 sm:max-h-[80vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-hidden bg-linear-to-br from-blue-600 via-blue-500 to-indigo-500 px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 sm:h-14 sm:w-14">
                <Building2 size={24} className="text-white sm:size-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-2xl">
                  เลือกหอพัก
                </h2>
                <p className="mt-0.5 text-xs text-blue-50/90 sm:text-sm">
                  เลือกหอพักที่ต้องการสร้างบิลในรอบนี้
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 cursor-pointer rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
            >
              <X size={18} />
            </button>
          </div>
          <div className="relative mt-5">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="ค้นหาชื่อหอพัก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface text-foreground placeholder:text-muted w-full rounded-xl border-0 py-3 pr-4 pl-10 text-sm shadow-lg outline-none focus:ring-2 focus:ring-white/70"
            />
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {filteredDorms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="bg-background flex h-14 w-14 items-center justify-center rounded-full">
                <Home size={24} className="text-muted" />
              </div>
              <p className="text-muted text-sm font-medium">
                {selectableDorms.length === 0
                  ? "ยังไม่มีหอพักในระบบ"
                  : "ไม่พบหอพักที่ค้นหา"}
              </p>
              <p className="text-muted text-xs">
                {selectableDorms.length === 0
                  ? "กรุณาเพิ่มหอพักก่อนเริ่มสร้างบิล"
                  : "ลองค้นหาด้วยคำอื่น"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredDorms.map((dorm, idx) => (
                <button
                  key={dorm.id}
                  onClick={() => {
                    onSelect(dorm.id);
                    onClose();
                  }}
                  className="group border-border bg-surface relative flex cursor-pointer items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg active:scale-[0.98] sm:p-5"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br sm:h-14 sm:w-14 ${CARD_ACCENTS[idx % CARD_ACCENTS.length]}`}
                  >
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                      {dorm.name}
                    </p>
                    <p className="text-muted mt-0.5 text-xs">
                      แตะเพื่อสร้างบิลของหอพักนี้
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-muted shrink-0 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-border bg-background/70 text-muted shrink-0 border-t px-5 py-3 text-center text-xs sm:px-8">
          แสดง {filteredDorms.length}จากทั้งหมด {selectableDorms.length}หอพัก
        </div>
      </div>
    </div>
  );
}
