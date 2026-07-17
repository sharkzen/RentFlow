"use client";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FormBanned() {
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
          <XCircle className="mb-6 h-20 w-20 text-red-500" />
        </motion.div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800">บัญชีถูกระงับ</h1>
        <p className="mb-6 text-gray-600">
          ขอโทษ! บัญชีเจ้าของหอพักของคุณถูกระงับหรือไม่ผ่านการอนุมัติ
        </p>
        <span className="my-2 text-sm font-bold">
          หากคุณคิดว่ามีความผิดพลาด กรุณาติดต่อฝ่ายสนับสนุนของ{" "}
          <span className="font-semibold">Rent Flow</span>
        </span>
        <div className="mb-6 w-full rounded-lg bg-red-50 p-4">
          <p className="font-medium text-red-700">
            คุณไม่สามารถเข้าถึงระบบจัดการหอพักได้ในขณะนี้
          </p>
        </div>
        <Link
          href="/"
          className="w-full cursor-pointer rounded-lg bg-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-600"
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
