"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  RefreshCw,
  ChevronRight,
  Edit3,
  Settings,
  Droplets,
} from "lucide-react";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import { RoomService } from "@/features/room/services/room.service"; // อย่าลืม import service ของคุณมาใช้

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scanType: "WATER" | "ELECTRIC";
  roomId: string; // [เพิ่ม] ต้องส่ง roomId เพื่อใช้ยิง API
  roomNumber: string;
  tenantName: string;
  waterMeterDigits?: number | null; // [เพิ่ม] ส่งค่าตั้งต้นมาเช็คว่าตั้งหรือยัง
  onConfirm: (ocrValue: string, file: File) => Promise<void>;
  onSkip: () => void;
  onSetupSuccess?: () => void; // [เพิ่ม] เอาไว้ trigger ให้หน้าหลัก fetch ข้อมูลใหม่ถ้าต้องการ
}

export default function MeterScannerModal({
  isOpen,
  onClose,
  scanType,
  roomId,
  roomNumber,
  tenantName,
  waterMeterDigits,
  onConfirm,
  onSkip,
  onSetupSuccess,
}: Props) {
  // เพิ่มสเตป "setup" เข้ามาเป็นสเตปแรก
  const [step, setStep] = useState<
    "setup" | "camera" | "processing" | "result"
  >("camera");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrValue, setOcrValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // State สำหรับหน้าตั้งค่า
  const [setupDigits, setSetupDigits] = useState<string>("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },

          advanced: [{ focusMode: "continuous" } as any],
        },
        audio: false,
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch((e) => {
        if (e.name !== "AbortError") throw e;
      });
      setIsCameraReady(true);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        log.error("Error accessing camera:", error);
        toast.error("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง");
      }
    }
  }, [stopCamera]);

  // เช็คเงื่อนไขตอนเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setPreview(null);
      setOcrValue("");

      // ถ้าเป็นมิเตอร์น้ำ และยังไม่ได้ตั้งค่าจำนวนหลัก ให้ไปหน้า setup ก่อน
      if (scanType === "WATER" && !waterMeterDigits) {
        setStep("setup");
        stopCamera();
      } else {
        setStep("camera");
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, scanType, waterMeterDigits, startCamera, stopCamera]);

  useEffect(() => {
    if (step === "result" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  // ฟังก์ชันบันทึกการตั้งค่า
  const handleSaveSetup = async () => {
    if (!setupDigits || Number(setupDigits) <= 0) {
      toast.warning("กรุณาระบุจำนวนหลักให้ถูกต้อง");
      return;
    }

    setIsSavingSetup(true);
    try {
      // ยิง API ไปอัปเดตห้อง (สมมติว่าคุณมี endpoint หรือนำ Payload ไปปรับใช้ให้ตรงกับ Service ของคุณ)
      await RoomService.updateRoom(roomId, {
        waterMeterDigits: Number(setupDigits),
      });

      toast.success("ตั้งค่ามิเตอร์สำเร็จ");
      onSetupSuccess?.(); // เรียก callback ถ้ามีการส่งมา

      // ข้ามไปหน้ากล้อง
      setStep("camera");
      startCamera();
    } catch (error) {
      log.error("Failed to update meter setup", error);
      toast.error("เกิดข้อผิดพลาดในการตั้งค่า กรุณาลองใหม่");
    } finally {
      setIsSavingSetup(false);
    }
  };

  const takePictureAndScan = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCameraReady) return;

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      canvas.width = videoW;
      canvas.height = videoH;
      ctx.drawImage(video, 0, 0, videoW, videoH);
      stopCamera();
      setStep("processing");

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 1.0),
      );
      const filename = `${scanType}_Room${roomNumber}_Full.jpg`;
      const fullFile = new File([blob], filename, { type: "image/jpeg" });
      setFile(fullFile);
      setPreview(URL.createObjectURL(fullFile));

      const visibleSquareSize = Math.min(videoW, videoH);
      const cropW = visibleSquareSize * (5 / 11);
      const cropH = visibleSquareSize * (1.5 / 11);
      const startX = (videoW - cropW) / 2;
      const startY = (videoH - cropH) / 2;

      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) throw new Error("Crop Canvas error");

      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      cropCtx.drawImage(
        canvas,
        startX,
        startY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH,
      );

      const croppedBase64 = cropCanvas
        .toDataURL("image/jpeg", 1.0)
        .split(",")[1];

      const res = await fetch(`/api/bills/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: croppedBase64,
          scanType: scanType,
          roomId: roomId,
        }),
      });

      if (!res.ok) {
        toast.error("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ในการอ่านตัวเลข");
        setOcrValue("");
        setStep("result");
        return;
      }

      const data = await res.json();
      if (data.success && data.number) {
        setOcrValue(data.number);
        toast.success("สแกนสำเร็จ!");
      } else {
        toast.warning("หาตัวเลขไม่พบ กรุณาพิมพ์เอง");
        setOcrValue("");
      }
      setStep("result");
    } catch (error) {
      log.error("Scanning Error:", error);
      toast.error("ระบบขัดข้อง กรุณาลองใหม่");
      setStep("camera");
      startCamera();
    }
  };

  const handleSubmit = async () => {
    if (!file || !ocrValue) {
      toast.error("กรุณาระบุตัวเลขมิเตอร์");
      inputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    await onConfirm(ocrValue, file);
    setIsSubmitting(false);
  };

  const handleRetake = () => {
    setStep("camera");
    setPreview(null);
    setFile(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex justify-center bg-black/80">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl duration-200 sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between bg-white px-5 py-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            {scanType === "WATER" ? "💧 สแกนมิเตอร์น้ำ" : "⚡ สแกนมิเตอร์ไฟ"}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-center">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-indigo-700">
              ห้อง {roomNumber}
            </h2>
            <p className="font-medium text-slate-600">{tenantName}</p>
          </div>

          {/* เงื่อนไขแสดง UI สเตป Setup */}
          {step === "setup" ? (
            <div className="mx-auto max-w-md rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6 text-left">
              <div className="mb-4 flex items-center gap-3 text-indigo-700">
                <Settings size={28} />
                <h3 className="text-xl font-bold">ตั้งค่าก่อนใช้งานครั้งแรก</h3>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                เนื่องจากเป็นครั้งแรกที่สแกนมิเตอร์น้ำห้องนี้ กรุณาระบุ{" "}
                <strong className="text-slate-800">จำนวนหลัก</strong>{" "}
                ที่ใช้คิดเงิน (นับเฉพาะตัวเลขสีดำ ไม่รวมตัวเลขสีแดงหรือทศนิยม)
              </p>

              <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  ตัวอย่าง
                </p>
                <div className="flex items-center gap-1 font-mono text-2xl font-black">
                  <span className="rounded bg-slate-800 px-2 py-1 text-white">
                    0
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-white">
                    1
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-white">
                    2
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-white">
                    3
                  </span>
                  <span className="rounded bg-red-500 px-2 py-1 text-white opacity-50">
                    6
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  👆 แบบนี้คือ 4 หลัก
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  จำนวนหลักตัวเลขสีดำ
                </label>
                <div className="relative">
                  <Droplets
                    className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="number"
                    value={setupDigits}
                    onChange={(e) => setSetupDigits(e.target.value)}
                    placeholder="เช่น 4 หรือ 5"
                    className="w-full rounded-xl border-2 border-slate-200 py-3 pr-4 pl-12 text-lg font-bold transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* UI กล้องและผลลัพธ์ (ของเดิม) */
            <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-black shadow-inner">
              {step === "camera" ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                preview && (
                  <img
                    src={preview}
                    alt="Captured"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )
              )}

              {step === "camera" && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <div className="box-content h-[13.6%] w-[45.5%] rounded border-2 border-red-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                  {!isCameraReady && (
                    <RefreshCw
                      size={40}
                      className="absolute animate-spin text-white/50"
                    />
                  )}
                </div>
              )}

              {step === "processing" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <RefreshCw
                    size={48}
                    className="mb-4 animate-spin text-indigo-400"
                  />
                  <p className="text-lg font-bold text-white">
                    กำลังดึงตัวเลข...
                  </p>
                </div>
              )}

              {step === "result" && (
                <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 px-6 backdrop-blur-md">
                  <p className="mb-3 text-sm font-bold text-emerald-400">
                    ✅ ตรวจสอบความถูกต้อง
                  </p>
                  <div className="relative w-full">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={ocrValue}
                      onChange={(e) =>
                        setOcrValue(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className={`w-full rounded-2xl border-4 bg-white py-4 text-center text-5xl font-black tracking-[0.2em] text-slate-800 transition-all outline-none ${ocrValue ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]" : "border-slate-300"}`}
                      placeholder="00000"
                    />
                    <Edit3
                      className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
                      size={24}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-6 pt-0">
          {step === "setup" ? (
            <div className="mt-6 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSetup}
                disabled={isSavingSetup || !setupDigits}
                className="flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                {isSavingSetup ? (
                  <RefreshCw className="animate-spin" size={24} />
                ) : (
                  "บันทึกและเริ่มสแกน"
                )}
              </button>
            </div>
          ) : step === "camera" ? (
            <div className="mt-6 flex gap-4">
              <button
                onClick={onSkip}
                className="flex-1 cursor-pointer rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200"
              >
                ข้าม
              </button>
              <button
                onPointerDown={takePictureAndScan}
                disabled={!isCameraReady}
                className="flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                <Camera size={24} />
                สแกน
              </button>
            </div>
          ) : (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleRetake}
                disabled={isSubmitting || step === "processing"}
                className="flex-1 cursor-pointer rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <RefreshCw size={20} className="mx-auto" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || step === "processing" || !ocrValue}
                className={`flex flex-[3] cursor-pointer items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition active:scale-95 ${ocrValue ? "bg-emerald-500 hover:bg-emerald-600" : "cursor-not-allowed bg-slate-300 opacity-70"}`}
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin" size={24} />
                ) : (
                  <>
                    ยืนยัน <ChevronRight size={24} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
