import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash,
  Save,
  X,
  ChevronDown,
  Check,
  Building,
  Zap,
  Droplets,
  Coins,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  rooms: any[];
}

export default function CreateBillDialog({
  isOpen,
  onClose,
  onSubmit,
  rooms,
}: Props) {
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [items, setItems] = useState<any[]>([
    {
      roomId: "",
      waterUnit: "",
      electricUnit: "",
      commonFee: 0,
    },
  ]);

  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        roomId: "",
        waterUnit: "",
        electricUnit: "",
        commonFee: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(
      (i) => i.roomId && i.waterUnit && i.electricUnit,
    );

    if (validItems.length === 0)
      return alert("กรุณากรอกข้อมูลอย่างน้อย 1 ห้อง");

    onSubmit({
      billingMonth: new Date(billingMonth + "-01"),

      items: validItems.map((i) => ({
        ...i,
        waterUnit: Number(i.waterUnit),
        electricUnit: Number(i.electricUnit),
        commonFee: Number(i.commonFee),
      })),
    });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">สร้างบิลใหม่</h2>
            <p className="mt-1 text-sm text-gray-500">
              บันทึกเลขมิเตอร์น้ำ-ไฟประจำเดือน
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto bg-gray-50/30 p-6"
          ref={dropdownRef}
        >
          <div className="mb-8 flex w-fit items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-semibold whitespace-nowrap text-gray-700">
              ประจำเดือน:
            </label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div className="mb-2 hidden grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase lg:grid">
            <div className="col-span-3">ห้องพัก</div>
            <div className="col-span-3">มิเตอร์น้ำ (ปัจจุบัน)</div>
            <div className="col-span-3">มิเตอร์ไฟ (ปัจจุบัน)</div>
            <div className="col-span-2">ค่าส่วนกลาง/อื่น</div>
            <div className="col-span-1 text-center">ลบ</div>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedRoom = rooms.find((r) => r.id === item.roomId);

              return (
                <div
                  key={index}
                  className="group relative grid grid-cols-1 items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md lg:grid-cols-12 lg:items-center"
                >
                  <div className="relative col-span-1 lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-500 lg:hidden">
                      ห้องพัก
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownIndex(
                          openDropdownIndex === index ? null : index,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-sm transition-all focus:outline-none ${openDropdownIndex === index ? "border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20" : "border-gray-300 text-gray-700 hover:border-gray-400"}`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Building
                          size={16}
                          className={
                            item.roomId ? "text-indigo-500" : "text-gray-400"
                          }
                        />
                        {selectedRoom
                          ? `ห้อง ${selectedRoom.roomNumber}`
                          : "เลือกห้องพัก"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${openDropdownIndex === index ? "rotate-180" : ""}`}
                      />
                    </button>

                    {openDropdownIndex === index && (
                      <div className="animate-in fade-in zoom-in-95 custom-scrollbar absolute top-[calc(100%+4px)] left-0 z-[100] max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl duration-100">
                        {rooms.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              handleChange(index, "roomId", r.id);
                              setOpenDropdownIndex(null);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${item.roomId === r.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700"}`}
                          >
                            <span>ห้อง {r.roomNumber}</span>
                            {item.roomId === r.id && <Check size={14} />}
                          </button>
                        ))}
                        {rooms.length === 0 && (
                          <div className="p-3 text-center text-sm text-gray-400">
                            ไม่มีข้อมูลห้อง
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-500 lg:hidden">
                      มิเตอร์น้ำ
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Droplets size={16} className="text-blue-500" />
                      </div>
                      <input
                        type="number"
                        placeholder="เลขมิเตอร์"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.waterUnit}
                        onChange={(e) =>
                          handleChange(index, "waterUnit", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-500 lg:hidden">
                      มิเตอร์ไฟ
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Zap size={16} className="text-amber-500" />
                      </div>
                      <input
                        type="number"
                        placeholder="เลขมิเตอร์"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.electricUnit}
                        onChange={(e) =>
                          handleChange(index, "electricUnit", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-gray-500 lg:hidden">
                      ค่าส่วนกลาง/อื่น
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Coins size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={item.commonFee}
                        onChange={(e) =>
                          handleChange(index, "commonFee", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-end lg:col-span-1 lg:justify-center">
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="ลบรายการ"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleAddItem}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            <Plus size={18} />
            เพิ่มรายการห้อง
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
          >
            <Save size={18} />
            บันทึกและสร้างบิล
          </button>
        </div>
      </div>
    </div>
  );
}
