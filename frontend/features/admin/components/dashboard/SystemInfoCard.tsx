import React from "react";
import { Info } from "lucide-react";

export const SystemInfoCard = () => {
  return (
    <div className="border-border bg-surface rounded-2xl border p-6">
      <h3 className="text-foreground mb-5 flex items-center gap-2 font-bold">
        <div className="rounded-full bg-blue-100 p-1">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        คำแนะนำระบบ
      </h3>
      <ul className="space-y-4">
        <li className="flex gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0 translate-y-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500"></span>
          </span>
          <p className="text-muted text-sm leading-relaxed">
            <span className="text-foreground font-semibold">
              การอนุมัติ Owner:
            </span>{" "}
            จำเป็นต้องตรวจสอบเอกสารให้ครบถ้วนก่อนกด Approve เพื่อความปลอดภัย
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"></span>
          <p className="text-muted text-sm leading-relaxed">
            <span className="text-foreground font-semibold">หอพักใหม่:</span>{" "}
            จะแสดงสถานะ Pending จนกว่าจะมีการตรวจสอบและ Publish โดย เจ้าของหอเอง
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"></span>
          <p className="text-muted text-sm leading-relaxed">
            <span className="text-foreground font-semibold">รอบบิล:</span>{" "}
            ระบบตัดรอบบิลตามที่ตั้งค่าจาก เจ้าของหอเอง
          </p>
        </li>
      </ul>
    </div>
  );
};
