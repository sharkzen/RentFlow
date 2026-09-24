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
  LightbulbOff,
  Focus,
  ZoomIn,
} from "lucide-react";

import { toast } from "react-toastify";
import log from "@/lib/logger";
import { RoomService } from "@/features/room/services/room.service";
import { BillService } from "@/features/bill/services/bill.service";

interface UploadResult {
  url: string;
  objectKey: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scanType: "WATER" | "ELECTRIC";
  roomId: string;
  roomNumber: string;
  tenantName: string;
  waterMeterDigits?: number | null;
  onConfirm: (ocrValue: string, uploadResult: UploadResult) => Promise<void>;
  onSkip: () => void;
  onSetupSuccess?: () => void;
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
  const [step, setStep] = useState<
    "setup" | "camera" | "processing" | "result"
  >("camera");

  const [preview, setPreview] = useState<string | null>(null);
  const [ocrValue, setOcrValue] = useState<string>("");
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [prevReading, setPrevReading] = useState<number | null>(null);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const failedAttemptsRef = useRef(0);
  const MAX_AUTO_RETRY = 3;
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [setupDigits, setSetupDigits] = useState<string>("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadPromiseRef = useRef<Promise<UploadResult> | null>(null);
  const uploadedKeyRef = useRef<string | null>(null);

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
          facingMode: {
            ideal: "environment",
          },

          width: {
            ideal: 1920,
          },

          height: {
            ideal: 1080,
          },

          advanced: [
            {
              focusMode: "continuous",
            } as any,
          ],
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

  const resetUploadState = (deletePrevious: boolean) => {
    if (deletePrevious) {
      if (uploadedKeyRef.current) {
        BillService.deleteTempImage(uploadedKeyRef.current).catch((err) =>
          log.error("Failed to clean up discarded upload", err),
        );
      } else if (uploadPromiseRef.current) {
        uploadPromiseRef.current
          .then((result) => BillService.deleteTempImage(result.objectKey))
          .catch((err) =>
            log.error("Failed to clean up discarded upload (deferred)", err),
          );
      }
    }

    uploadPromiseRef.current = null;
    uploadedKeyRef.current = null;
  };

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      setOcrValue("");
      setOcrWarning(null);
      failedAttemptsRef.current = 0;
      resetUploadState(false);
      setPrevReading(null);
      setIsPreviewZoomed(false);

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

  const handleSaveSetup = async () => {
    if (!setupDigits || Number(setupDigits) <= 0) {
      toast.warning("กรุณาระบุจำนวนหลักให้ถูกต้อง");
      return;
    }

    setIsSavingSetup(true);

    try {
      await RoomService.updateRoom(roomId, {
        waterMeterDigits: Number(setupDigits),
      });

      toast.success("ตั้งค่ามิเตอร์สำเร็จ");
      onSetupSuccess?.();
      setStep("camera");
      startCamera();
    } catch (error) {
      log.error("Failed to update meter setup", error);
      toast.error("เกิดข้อผิดพลาดในการตั้งค่า กรุณาลองใหม่");
    } finally {
      setIsSavingSetup(false);
    }
  };

  const handleUnreadableImage = (rawMessage?: string) => {
    failedAttemptsRef.current += 1;
    const isBlurry = rawMessage?.toLowerCase().includes("blurry");
    const reasonText = isBlurry
      ? "ภาพเบลอเกินไป"
      : "หาตัวเลขมิเตอร์ในภาพไม่เจอ";

    if (failedAttemptsRef.current < MAX_AUTO_RETRY) {
      toast.warning(
        `${reasonText} กำลังเปิดกล้องให้ถ่ายใหม่ (ครั้งที่ ${failedAttemptsRef.current}/${MAX_AUTO_RETRY})`,
      );

      resetUploadState(true);
      setPreview(null);
      setOcrValue("");
      setOcrWarning(null);
      setStep("camera");
      startCamera();
    } else {
      toast.error(`${reasonText} หลายครั้งแล้ว กรุณาพิมพ์ตัวเลขเอง`);
      failedAttemptsRef.current = 0;
      setOcrValue("");
      setOcrWarning(null);
      setStep("result");
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
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.75),
      );
      const filename = `${scanType}_Room${roomNumber}_Full.jpg`;

      const fullFile = new File([blob], filename, {
        type: "image/jpeg",
      });

      setPreview(URL.createObjectURL(fullFile));

      const uploadPromise = (async () => {
        const formData = new FormData();
        formData.append("file", fullFile);
        const res = await BillService.uploadTempImage(formData);
        uploadedKeyRef.current = res.objectKey;
        return res as UploadResult;
      })();

      uploadPromise.catch((err) => {
        log.error("Background upload failed:", err);
      });

      uploadPromiseRef.current = uploadPromise;
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

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          imageBase64: croppedBase64,
          scanType: scanType,
          roomId: roomId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        handleUnreadableImage(data?.message);
        return;
      }

      if (data?.success && data.number) {
        failedAttemptsRef.current = 0;
        setOcrValue(data.number);
        setPrevReading(
          typeof data.prevValue === "number" ? data.prevValue : null,
        );

        if (data.suspicious || data.needsReview) {
          setOcrWarning(
            data.warningMessage ??
              "ตัวเลขที่อ่านได้อาจไม่แม่นยำ กรุณาตรวจสอบก่อนยืนยัน",
          );

          toast.warning("กรุณาตรวจสอบตัวเลขก่อนยืนยัน");
        } else {
          setOcrWarning(null);
          toast.success("สแกนสำเร็จ!");
        }

        setStep("result");
        return;
      }

      handleUnreadableImage(data?.message);
    } catch (error) {
      log.error("Scanning Error:", error);
      toast.error("ระบบขัดข้อง กรุณาลองใหม่");
      resetUploadState(true);
      setPreview(null);
      setStep("camera");
      startCamera();
    }
  };

  const handleSubmit = async () => {
    if (!ocrValue) {
      toast.error("กรุณาระบุตัวเลขมิเตอร์");
      inputRef.current?.focus();
      return;
    }

    if (!uploadPromiseRef.current) {
      toast.error("ไม่พบรูปภาพที่อัปโหลด กรุณาถ่ายใหม่");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadResult = await uploadPromiseRef.current;
      await onConfirm(ocrValue, uploadResult);
    } catch (error) {
      log.error("Submit Error:", error);
      toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองถ่ายใหม่อีกครั้ง");
      resetUploadState(true);
      setPreview(null);
      setStep("camera");
      startCamera();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    resetUploadState(true);
    setPrevReading(null);
    setIsPreviewZoomed(false);
    setStep("camera");
    setPreview(null);
    setOcrWarning(null);
    failedAttemptsRef.current = 0;
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex justify-center bg-black/80">
      <div className="bg-surface animate-in fade-in zoom-in-95 flex w-full max-w-4xl flex-col overflow-hidden shadow-2xl duration-200 sm:rounded-3xl">
        <div className="bg-surface flex shrink-0 items-center justify-between px-5 py-4 shadow-sm">
          <h3 className="text-foreground text-lg font-bold">
            {scanType === "WATER" ? "💧 สแกนมิเตอร์น้ำ" : "⚡ สแกนมิเตอร์ไฟ"}
          </h3>
          <button
            onClick={onClose}
            className="bg-background text-muted cursor-pointer rounded-full p-2 transition-colors hover:bg-red-100 hover:text-red-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-center">
          <div className="mb-2 flex justify-evenly">
            <h2 className="text-2xl font-black text-indigo-700">
              ห้อง {roomNumber}
            </h2>
          </div>
          {step === "setup" ? (
            <div className="mx-auto max-w-md rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6 text-left">
              <div className="mb-4 flex items-center gap-3 text-indigo-700">
                <Settings size={28} />
                <h3 className="text-xl font-bold">ตั้งค่าก่อนใช้งานครั้งแรก</h3>
              </div>
              <p className="text-muted mb-4 text-sm">
                เนื่องจากเป็นครั้งแรกที่สแกนมิเตอร์น้ำห้องนี้ กรุณาระบุ{" "}
                <strong className="text-foreground">จำนวนหลัก</strong>{" "}
                ที่ใช้คิดเงิน (นับเฉพาะตัวเลขสีดำ ไม่รวมตัวเลขสีแดงหรือทศนิยม)
              </p>
              <div className="bg-surface mb-6 rounded-xl p-4 shadow-sm">
                <p className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">
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
                <label className="text-foreground text-sm font-bold">
                  จำนวนหลักตัวเลขสีดำ
                </label>
                <div className="relative">
                  <Droplets
                    className="text-muted absolute top-1/2 left-4 -translate-y-1/2"
                    size={20}
                  />
                  <input
                    type="number"
                    value={setupDigits}
                    onChange={(e) => setSetupDigits(e.target.value)}
                    placeholder="เช่น 4 หรือ 5"
                    className="bg-surface text-foreground border-border w-full rounded-xl border-2 py-3 pr-4 pl-12 text-lg font-bold transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-black">
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
                {step === "result" && preview && (
                  <button
                    type="button"
                    onClick={() => setIsPreviewZoomed(true)}
                    className="absolute right-2 bottom-2 z-30 flex cursor-pointer items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <ZoomIn size={14} /> ขยายรูป
                  </button>
                )}
              </div>
              {/* ช่องกรอกอยู่ใต้รูป ไม่ทับรูป — ผู้ใช้ต้องเห็นรูปชัดๆ เพื่อเทียบตัวเลขก่อนยืนยัน */}
              {step === "result" && (
                <div className="animate-in fade-in mx-auto mt-4 w-full max-w-[320px]">
                  <p
                    className={`mb-2 text-sm font-bold ${ocrWarning ? "text-amber-500" : "text-emerald-600"}`}
                  >
                    {ocrWarning
                      ? "⚠️ กรุณาตรวจสอบตัวเลขกับรูป"
                      : "✅ ตรวจสอบความถูกต้อง"}
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
                      className={`bg-surface text-foreground w-full rounded-2xl border-4 py-3 text-center text-4xl font-black tracking-[0.2em] transition-all outline-none ${ocrWarning ? "border-amber-500" : ocrValue ? "border-emerald-500" : "border-border"}`}
                      placeholder="00000"
                    />
                    <Edit3
                      className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
                      size={22}
                    />
                  </div>
                  {prevReading !== null && (
                    <p className="text-muted mt-2 text-sm">
                      เดือนก่อน:{" "}
                      <span className="text-foreground font-mono font-bold">
                        {prevReading}
                      </span>
                    </p>
                  )}
                  {ocrWarning && (
                    <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-left text-sm font-medium text-amber-600 dark:text-amber-400">
                      {ocrWarning}
                    </p>
                  )}
                </div>
              )}
              {step === "camera" && (
                <div className="mx-auto mt-5 w-full max-w-[320px] rounded-2xl bg-slate-800 p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-slate-200">
                      <Focus className="h-4 w-4 shrink-0 text-red-400" />
                      <span className="text-left text-xs leading-tight font-medium">
                        สแกนให้ตัวเลขอยู่ในกรอบสีแดง
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <LightbulbOff className="h-4 w-4 shrink-0 text-amber-400" />
                      <span className="text-left text-xs leading-tight font-medium">
                        โปรดหลีกเลี่ยงแสงสะท้อนบนหน้าปัด
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Edit3 className="h-4 w-4 shrink-0 text-blue-400" />
                      <span className="text-left text-xs leading-tight font-medium">
                        พิมพ์แก้ไขตัวเลขเองได้ หากอ่านไม่ครบ
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Camera className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-left text-xs leading-tight font-medium">
                        ระบบจะเก็บรูปเพื่อบันทึกหลังสแกน
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-border bg-surface mt-2 border-t p-6 pt-0">
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
                onClick={takePictureAndScan}
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
      {isPreviewZoomed && preview && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/95 p-2"
          onClick={() => setIsPreviewZoomed(false)}
        >
          <img
            src={preview}
            alt="Captured full size"
            className="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/15 p-2 text-white"
            aria-label="ปิดรูป"
          >
            <X size={24} />
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
