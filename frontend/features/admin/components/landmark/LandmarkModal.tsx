import { useState, useEffect, useRef } from "react";
import {
  LandmarkType,
  LandmarkTypeLabel,
  CreateLandmarkPayload,
} from "@/features/admin/types";
import { Button } from "@/lib/ui/Button";
import { Map, X, MapPin, Search, ChevronDown, Check } from "lucide-react";
import { Landmark } from "@/features/admin/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLandmarkPayload) => Promise<void>;
  initialData?: Landmark | null;
}

export const LandmarkModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const [formData, setFormData] = useState<CreateLandmarkPayload>({
    name: "",
    type: LandmarkType.UNIVERSITY,
    mapUrl: "",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          type: initialData.type,
          mapUrl: initialData.mapUrl,
        });
      } else {
        setFormData({
          name: "",
          type: LandmarkType.UNIVERSITY,
          mapUrl: "",
        });
      }

      setIsDropdownOpen(false);
      setSearchTerm("");
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = !!initialData;
  const landmarkTypes = Object.values(LandmarkType);
  const filteredTypes = landmarkTypes.filter((t) =>
    LandmarkTypeLabel[t].toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300">
      <div className="animate-in zoom-in-95 border-border bg-surface w-full max-w-md transform overflow-visible rounded-2xl border shadow-xl transition-all duration-200">
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-foreground text-lg font-bold">
              {isEditMode ? "แก้ไขข้อมูลสถานที่" : "เพิ่มสถานที่ใหม่"}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-muted hover:bg-background hover:text-foreground cursor-pointer rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-semibold">
              ชื่อสถานที่ <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              className="bg-background text-foreground hover:bg-border focus:bg-surface h-11 w-full rounded-lg border border-transparent px-4 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              placeholder="เช่น มหาวิทยาลัย, เซ็นทรัล..."
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-foreground text-sm font-semibold">
              ประเภท <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-background text-foreground hover:bg-border focus:bg-surface flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-transparent px-4 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              >
                <span>{LandmarkTypeLabel[formData.type]}</span>
                <ChevronDown
                  className={`text-muted h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="border-border bg-surface absolute top-full left-0 z-[110] mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                  <div className="border-border bg-surface border-b p-2">
                    <div className="relative">
                      <Search className="text-muted absolute top-2 left-2.5 h-4 w-4" />
                      <input
                        type="text"
                        className="bg-background text-foreground focus:bg-surface h-8 w-full rounded-md pr-3 pl-8 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder="ค้นหาประเภท..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 space-y-1 overflow-y-auto p-1">
                    {filteredTypes.length > 0 ? (
                      filteredTypes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              type: t as LandmarkType,
                            });

                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                          className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${formData.type === t ? "bg-blue-50 font-medium text-blue-700" : "text-foreground hover:bg-background"}`}
                        >
                          {LandmarkTypeLabel[t]}
                          {formData.type === t && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-muted py-3 text-center text-sm">
                        ไม่พบประเภทที่ค้นหา
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-semibold">
              ลิงก์ Google Maps <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Map className="text-muted h-4 w-4" />
              </div>
              <input
                required
                type="url"
                className="bg-background text-foreground hover:bg-border focus:bg-surface h-11 w-full rounded-lg border border-transparent pr-4 pl-10 text-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                placeholder="https://maps.app.goo.gl/..."
                value={formData.mapUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mapUrl: e.target.value,
                  })
                }
              />
            </div>
            <p className="text-muted text-xs">
              วางลิงก์จาก Google Maps ระบบจะ
              {isEditMode ? "คำนวณพิกัดใหม่" : "ดึงพิกัดให้อัตโนมัติ"}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 px-6 shadow-md shadow-blue-500/20 hover:bg-blue-700"
            >
              {isEditMode ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
