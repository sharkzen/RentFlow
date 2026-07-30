import { Building, ChevronDown, Check, Search, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

interface Dorm {
  id: string;
  name: string;
}

interface Props {
  dorms: Dorm[];
  selectedDorm: string;
  onSelect: (id: string) => void;
}

export default function DormSelector({ dorms, selectedDorm, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDormName = useMemo(
    () => dorms.find((d) => d.id === selectedDorm)?.name || "เลือกหอพัก",
    [dorms, selectedDorm],
  );

  const filteredDorms = useMemo(() => {
    return dorms.filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [dorms, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setTimeout(() => setSearchTerm(""), 200);
  }, [isOpen]);

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-surface flex w-full min-w-[200px] cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-100 focus:outline-none ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : "border-border hover:bg-background"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building
            size={18}
            className={isOpen ? "text-indigo-600" : "text-muted"}
          />
          <span
            className={`truncate ${selectedDorm ? "text-foreground" : "text-muted"}`}
          >
            {currentDormName}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-border bg-surface animate-in fade-in zoom-in-95 absolute left-0 z-50 mt-2 w-full min-w-[240px] origin-top-right overflow-hidden rounded-xl border shadow-xl ring-1 ring-black/5 md:right-0 md:right-auto">
          <div className="border-border border-b p-2">
            <div className="relative">
              <Search className="text-muted absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหอพัก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-border bg-background focus:bg-surface w-full rounded-lg border py-2 pr-8 pl-9 text-sm transition-colors outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent max-h-60 space-y-1 overflow-y-auto p-1">
            {filteredDorms.length === 0 ? (
              <div className="text-muted py-8 text-center text-sm">
                ไม่พบหอพักที่ค้นหา
              </div>
            ) : (
              filteredDorms.map((dorm) => {
                const isSelected = selectedDorm === dorm.id;

                return (
                  <button
                    key={dorm.id}
                    onClick={() => {
                      onSelect(dorm.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground hover:bg-background"}`}
                  >
                    <span className="truncate pr-2">{dorm.name}</span>
                    {isSelected && (
                      <Check size={16} className="shrink-0 text-indigo-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-border bg-background text-muted border-t px-3 py-2 text-[10px]">
            แสดง {filteredDorms.length}จาก {dorms.length}หอพัก
          </div>
        </div>
      )}
    </div>
  );
}
