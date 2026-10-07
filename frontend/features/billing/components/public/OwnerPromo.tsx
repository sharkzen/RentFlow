"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Gift } from "lucide-react";
import { axios } from "@/lib/api/api-client";

interface PublicTrial {
  planName: string;
  days: number;
}

/** วันทดลองฟรีที่แอดมินตั้งไว้ (ไม่ hardcode) ถ้าปิดทดลองหรือโหลดไม่ได้จะไม่แสดงข้อความทดลอง */
function usePublicTrial() {
  const [trial, setTrial] = useState<PublicTrial | null>(null);

  useEffect(() => {
    let cancelled = false;

    axios
      .get("/api/billing/public/pricing")
      .then((res) => {
        if (!cancelled) setTrial(res.data?.data?.trial ?? null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return trial;
}

const POINTS = [
  "ลงประกาศหอพักได้ฟรี ทุกหอ",
  "ตั้งค่าหอพัก ราคา ค่าน้ำ-ค่าไฟ และรูปภาพได้ทันที",
  "ทดลองระบบผู้เช่า ออกบิล และตรวจสลิปอัตโนมัติ (หลังอนุมัติบัญชี)",
];

/** แผงโปรโมทเจ้าของหอพักบนหน้าสมัคร (จอใหญ่ ซ้อนบนรูปพื้นหลัง) */
export function OwnerPromoPanel() {
  const trial = usePublicTrial();

  return (
    <div className="max-w-lg">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
        <Gift size={16} />
        สำหรับเจ้าของหอพัก
      </p>
      <h2 className="text-4xl leading-tight font-bold xl:text-5xl">
        ลงประกาศหอพัก
        <br />
        ฟรี
      </h2>
      <p className="mt-4 text-lg text-white/90">
        {trial
          ? `ลงทะเบียนวันนี้ ทดลองใช้ระบบจัดการหอพักฟรี ${trial.days} วัน`
          : "ลงทะเบียนเพื่อเริ่มลงประกาศและบริหารหอพักของคุณ"}
      </p>
      <ul className="mt-6 space-y-3 text-sm text-white/90">
        {POINTS.map((p) => (
          <li key={p} className="flex items-start gap-2.5">
            <Check
              size={18}
              className="mt-0.5 shrink-0 rounded-full bg-emerald-400/90 p-0.5 text-white"
            />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href="/pricing"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-transform hover:-translate-y-0.5"
      >
        ดูราคาแพ็คเกจ
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/** แถบโปรโมทเล็ก เหนือฟอร์มสมัครบนมือถือ/จอเล็กที่ซ่อนแผงด้านข้าง */
export function OwnerPromoStrip() {
  const trial = usePublicTrial();

  return (
    <div className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 sm:flex-row sm:items-center dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
      <Gift className="shrink-0" size={22} />
      <p className="flex-1 text-sm">
        <span className="font-semibold">ลงประกาศหอพักฟรี</span>
        {trial
          ? ` และทดลองใช้ระบบจัดการหอพักฟรี ${trial.days} วัน`
          : " และบริหารหอพักได้ในที่เดียว"}
      </p>
      <Link
        href="/pricing"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
      >
        ดูราคาแพ็คเกจ
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
