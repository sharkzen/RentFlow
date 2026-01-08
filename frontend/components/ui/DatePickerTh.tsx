"use client";
import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale/th";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
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

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
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
          dateFormat="d MMMM yyyy"
          locale="th"
          placeholderText="เลือกวันที่"
          className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white pr-3 pl-10 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
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
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
              >
                {"<"}
              </button>
              <div className="flex gap-2">
                <select
                  value={date.getFullYear()}
                  onChange={({ target: { value } }) =>
                    changeYear(Number(value))
                  }
                  className="rounded border bg-white p-1 text-sm"
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
                  className="rounded border bg-white p-1 text-sm"
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
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
              >
                {">"}
              </button>
            </div>
          )}
        />
        <Calendar className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}
