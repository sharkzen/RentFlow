import { useState, useRef, RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { format, getYear, getMonth, setMonth, setYear } from "date-fns";
import { th } from "date-fns/locale";
import { useOnClickOutside } from "usehooks-ts";

interface Props {
  selectedDate: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

export default function MonthYearPicker({
  selectedDate,
  onChange,
  disabled,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref as RefObject<HTMLDivElement>, () => setIsOpen(false));

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const currentYear = getYear(new Date());

  const years = Array.from(
    {
      length: 5,
    },
    (_, i) => currentYear - 2 + i,
  );

  const handleSelectMonth = (monthIndex: number) => {
    onChange(setMonth(selectedDate, monthIndex));
    setIsOpen(false);
  };

  const handleSelectYear = (year: number) => {
    onChange(setYear(selectedDate, year));
  };

  return (
    <div
      // 1. เพิ่ม z-50 ตรงนี้ เพื่อให้ Container มีลำดับชั้นสูงกว่า element อื่นในหน้าเดียวกัน
      className="relative z-50 w-full sm:flex sm:w-auto sm:justify-start"
      ref={ref}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-all hover:border-indigo-300 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start"
      >
        <div className="flex items-center gap-2 text-xs text-gray-800">
          <span className="font-bold">
            {format(selectedDate, "MMMM", {
              locale: th,
            })}
          </span>
          <span className="font-medium text-gray-500">
            {getYear(selectedDate) + 543}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          // 2. ปรับ z-index เป็น z-[100] ให้ชัวร์ว่าลอยทับสุดๆ
          // 3. เอา sm:right-0 sm:left-auto ออก และใช้แค่ left-0 เพื่อให้ Dropdown กางไปทางขวาเสมอ จะได้ไม่ทะลุขอบซ้ายตอนจอใหญ่
          className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-[100] mt-2 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5 sm:w-72"
        >
          <div className="mb-4 border-b border-gray-100 pb-3">
            <label className="mb-2 block text-xs font-semibold text-gray-500">
              เลือกปี (พ.ศ.)
            </label>
            <div className="custom-scrollbar flex gap-2 overflow-x-auto p-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleSelectYear(year)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${getYear(selectedDate) === year ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                >
                  {year + 543}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-500">
              เลือกเดือน
            </label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleSelectMonth(index)}
                  className={`cursor-pointer rounded-md px-2 py-2 text-xs font-medium transition-colors ${getMonth(selectedDate) === index ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"}`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
