"use client";
import React, { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale/th";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { Calendar } from "lucide-react";
dayjs.extend(buddhistEra);
dayjs.locale("th");
registerLocale("th", th);

interface DatePickerThProps {
  label: string;
  value: string;
  onChange: (dateString: string) => void;
  required?: boolean;
  error?: string;
}

export default function DatePickerTh({
  label,
  value,
  onChange,
  required,
}: DatePickerThProps) {
  const selectedDate = value ? new Date(value) : null;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full">
      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        <Calendar size={15} />
      </label>
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            if (date) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              onChange(`${year}-${month}-${day}`);
            } else {
              onChange("");
            }
          }}
          wrapperClassName="w-full"
          dateFormat="d MMMM yyyy"
          locale="th"
          placeholderText="เลือกวันที่"
          withPortal={isMobile}
          fixedHeight
          popperPlacement="bottom-start"
          className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white pr-3 pl-5 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-2 py-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                {"<"}
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                <select
                  value={date.getFullYear()}
                  onChange={({ target: { value } }) =>
                    changeYear(Number(value))
                  }
                  className="cursor-pointer rounded border border-gray-200 bg-white p-1 text-xs font-medium focus:border-indigo-500 focus:outline-none sm:text-sm"
                >
                  {Array.from(
                    {
                      length: 20,
                    },
                    (_, i) => new Date().getFullYear() - 10 + i,
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y + 543}
                    </option>
                  ))}
                </select>
                <select
                  value={date.getMonth()}
                  onChange={({ target: { value } }) =>
                    changeMonth(Number(value))
                  }
                  className="cursor-pointer rounded border border-gray-200 bg-white p-1 text-xs font-medium focus:border-indigo-500 focus:outline-none sm:text-sm"
                >
                  {[
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
                  ].map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                {">"}
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
