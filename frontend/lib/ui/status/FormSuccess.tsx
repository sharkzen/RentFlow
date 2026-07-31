"use client";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FormSuccess() {
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
          <CheckCircle className="mb-6 h-20 w-20 text-green-500" />
        </motion.div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          สมัครเจ้าของหอพักสำเร็จ!
        </h1>
        <p className="mb-6 text-gray-600 dark:text-white">
          ขอบคุณที่ลงทะเบียนเป็นเจ้าของหอพักกับ{" "}
          <span className="font-semibold dark:text-white">Rent Flow</span>.
          <br />
          เราจะทำการตรวจสอบข้อมูลของคุณภายใน 24 ชั่วโมง
        </p>
        <span className="my-2 text-sm font-bold">
          หลังจากตรวจสอบเสร็จสิ้น ระบบจะส่งอีเมลแจ้งผลไปยังคุณโดยอัตโนมัติ
        </span>
        <div className="mb-6 w-full rounded-lg bg-green-50 p-4">
          <p className="font-medium text-green-700">
            คุณสามารถเริ่มจัดการหอพักของคุณได้ทันทีหลังจากการตรวจสอบเสร็จสิ้น
          </p>
        </div>
        <Link
          href="/"
          className="w-full cursor-pointer rounded-lg bg-green-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-green-600"
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
