import React from "react";
import QrCodeManager from "./_components/QrCodeManager";

export const metadata = {
  title: "เข้าระบบด้วย QR Code | RentFlow",
};

export default function QrCodePage() {
  return (
    <div className="w-full flex-1">
      <div className="mx-auto max-w-[1600px]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            เข้าระบบด้วย QR Code
          </h1>
          <p className="text-sm text-gray-500 sm:text-base">
            จัดการสิทธิ์และสร้าง PDF QR Code สำหรับสแกนเข้าระบบของแต่ละห้องพัก
          </p>
        </div>
        <QrCodeManager />
      </div>
    </div>
  );
}
