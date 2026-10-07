"use client";
import React from "react";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import type { MyBilling } from "../../types";

type Trial = Extract<MyBilling["trial"], { available: true }>;

const DAY_MS = 24 * 60 * 60 * 1000;

const dateTh = (d: Date) =>
  d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** รายละเอียดก่อนรับทดลองฟรี: แพ็คเกจ สิทธิ์ที่ได้ วันเริ่ม/วันหมด และสิ่งที่เกิดหลังหมด */
function trialSummary(trial: Trial) {
  const now = new Date();
  const end = new Date(now.getTime() + trial.days * DAY_MS);
  const { limits } = trial;

  const perks = [
    `สร้างได้ ${limits.maxDorms} หอ ${limits.maxRooms} ห้อง`,
    limits.slipUnlimited
      ? "ตรวจสลิปอัตโนมัติไม่จำกัด"
      : `ตรวจสลิปอัตโนมัติ ${limits.slipQuotaMonthly} ครั้ง/เดือน`,
    ...(limits.hasOcr ? ["สแกนมิเตอร์ด้วย OCR"] : []),
  ];

  return [
    `แพ็คเกจ ${trial.planName} ใช้ฟรี ${trial.days} วัน ไม่ต้องชำระเงิน`,
    `เริ่มวันนี้ ${dateTh(now)} หมดอายุ ${dateTh(end)}`,
    `สิทธิ์ที่ได้: ${perks.join(" · ")}`,
    "ซื้อแพ็คเกจระหว่างทดลอง วันทดลองที่เหลือจะต่อท้ายให้",
    "หลังหมดอายุ ข้อมูลยังอยู่ครบ แต่เพิ่มหอ ห้อง หรือออกบิลใหม่ไม่ได้จนกว่าจะเลือกแพ็คเกจ",
    "รับสิทธิ์ทดลองได้ครั้งเดียวต่อบัญชี",
  ].join("\n");
}

export default function TrialConfirmDialog({
  isOpen,
  trial,
  isLoading,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  trial: Trial;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      type="info"
      title="ยืนยันรับสิทธิ์ทดลองใช้ฟรี?"
      description={trialSummary(trial)}
      confirmText="ยืนยันรับสิทธิ์"
      cancelText="ยกเลิก"
    />
  );
}
