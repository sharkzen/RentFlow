import React from "react";
import { Phone, User, Droplets, Zap, Banknote, Facebook } from "lucide-react";
import { DormSlugResponse } from "@/features/dormitory/types";

// Icon Line แบบ Custom SVG
const LineIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22 10.8c0-4.9-5.1-8.8-11.4-8.8s-11.4 3.9-11.4 8.8c0 4.3 3.8 7.9 9.5 8.7.4.1.9.3 1 .8.1.5.1 1-.1 1.6-.1.2-.6 1.6-.7 2 0 0-.2.9.5 1.1s3.7-2.3 5.1-4c3.9-.3 7.5-3.6 7.5-10.2z" />
  </svg>
);

export const DormSidebar: React.FC<{ data: DormSlugResponse }> = ({ data }) => {
  const { settings, owner } = data;

  return (
    <div className="space-y-6 md:sticky md:top-24">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-blue-900/5">
        <div className="bg-blue-600 p-6 text-center text-white">
          <p className="mb-1 text-sm font-medium opacity-90">ราคาเริ่มต้น</p>
          <div className="flex items-baseline justify-center gap-1">
            <h2 className="text-4xl font-extrabold tracking-tight">
              {settings.roomPrice.toLocaleString()}
            </h2>
            <span className="text-lg font-medium opacity-80">บาท/เดือน</span>
          </div>
        </div>

        <div className="bg-white p-6">
          <h3 className="mb-4 text-sm font-bold text-gray-900">
            ค่าใช้จ่ายเพิ่มเติม
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <div className="rounded-full bg-blue-50 p-1.5">
                  <Droplets size={14} className="text-blue-500" />
                </div>
                ค่าน้ำ
              </span>
              <span className="font-semibold text-gray-900">
                {settings.waterRate} บ./หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <div className="rounded-full bg-yellow-50 p-1.5">
                  <Zap size={14} className="text-yellow-500" />
                </div>
                ค่าไฟ
              </span>
              <span className="font-semibold text-gray-900">
                {settings.electricRate} บ./หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <div className="rounded-full bg-green-50 p-1.5">
                  <Banknote size={14} className="text-green-500" />
                </div>
                ส่วนกลาง
              </span>
              <span className="font-semibold text-gray-900">
                {settings.commonFee || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/50">
        <h3 className="mb-4 text-center text-lg font-bold text-gray-900">
          สนใจติดต่อสอบถาม
        </h3>
        <div className="space-y-3">
          <a
            href={`tel:${owner.phone}`}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <Phone size={20} className="fill-current" />
            <span>{owner.phone}</span>
          </a>

          {owner.lineId && (
            <a
              href={`https://line.me/ti/p/~${owner.lineId.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#06C755] px-4 py-3.5 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-[#05b34c] hover:shadow-xl hover:shadow-green-300 active:scale-95"
            >
              <LineIcon className="h-5 w-5" />
              <span>Line ID: {owner.lineId}</span>
            </a>
          )}

          {owner.facebook && (
            <a
              href={owner.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-[#166fe5] hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            >
              <Facebook size={20} className="fill-current" />
              <span>Facebook</span>
            </a>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-t border-gray-100 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 ring-2 ring-white">
            <User size={20} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">{owner.fullName}</p>
            <p className="text-xs text-gray-500">เจ้าของหอพัก</p>
          </div>
        </div>
      </div>
    </div>
  );
};
