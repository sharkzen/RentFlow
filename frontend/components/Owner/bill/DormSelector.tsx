import { Building, ChevronDown, Check } from "lucide-react";
import { useState } from "react";

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
  const currentDormName =
    dorms.find((d) => d.id === selectedDorm)?.name || "เลือกหอพัก";

  return (
    <div className="relative min-w-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-indigo-100"
      >
        <div className="flex items-center gap-2 truncate">
          <Building size={16} className="text-indigo-600" />
          <span className="max-w-30 truncate">{currentDormName}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-xl border border-gray-100 bg-white p-1 shadow-xl ring-1 ring-black/5">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
              เลือกหอพัก
            </div>
            {dorms.map((dorm) => (
              <button
                key={dorm.id}
                onClick={() => {
                  onSelect(dorm.id);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${selectedDorm === dorm.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{dorm.name}</span>
                {selectedDorm === dorm.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
