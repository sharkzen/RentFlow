"use client";
import { Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FormPending() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center p-8 text-center">
        <motion.div
          initial={{
            rotate: -180,
            scale: 0,
          }}
          animate={{
            rotate: 0,
            scale: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 15,
          }}
        >
          <Clock className="mb-6 h-20 w-20 text-yellow-500" />
        </motion.div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-yellow-500">
          รอการอนุมัติ
        </h1>
        <p className="mb-6 text-gray-600 dark:text-white">
          ขอบคุณที่ลงทะเบียนเป็นเจ้าของหอพักกับ{" "}
          <span className="font-semibold">Rent Flow</span>.<br />
          ระบบกำลังตรวจสอบข้อมูลของคุณ
        </p>
        <span className="my-2 text-sm font-bold">
          หลังจากตรวจสอบเสร็จสิ้น ระบบจะส่งอีเมลแจ้งผลไปยังคุณโดยอัตโนมัติ
        </span>
        <div className="mb-6 w-full rounded-lg bg-yellow-50 p-4">
          <p className="font-medium text-yellow-700">
            กรุณารอสักครู่ เราจะอนุมัติบัญชีของคุณเร็วที่สุด
          </p>
        </div>
        <Link
          href="/pricing"
          className="mb-3 w-full cursor-pointer rounded-lg border border-yellow-500 px-6 py-3 font-semibold text-yellow-700 transition-colors hover:bg-yellow-50 dark:text-yellow-500 dark:hover:bg-yellow-500/10"
        >
          ดูราคาแพ็คเกจระหว่างรออนุมัติ
        </Link>
        <Link
          href="/"
          className="w-full cursor-pointer rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-yellow-600"
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
