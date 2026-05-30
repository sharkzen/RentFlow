"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Save,
  RefreshCw,
  ChevronRight,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import log from "@/lib/logger";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scanType: "WATER" | "ELECTRIC";
  roomNumber: string;
  tenantName: string;
  onConfirm: (ocrValue: string, file: File) => Promise<void>;
  onSkip: () => void;
}

export default function MeterScannerModal({
  isOpen,
  onClose,
  scanType,
  roomNumber,
  tenantName,
  onConfirm,
  onSkip,
}: Props) {
  const [step, setStep] = useState<"camera" | "processing" | "result">(
    "camera",
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrValue, setOcrValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const EXPECTED_DIGITS = scanType === "WATER" ? 4 : 5;
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
          facingMode: {
            ideal: "environment",
          },

          width: {
            ideal: 1920,
          },

          height: {
            ideal: 1080,
          },
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
        toast.error(
          "ไม่สามารถเข้าถึงกล้องได้ กรุณาใช้ HTTPS หรือตรวจสอบสิทธิ์",
        );
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setStep("camera");
      setFile(null);
      setPreview(null);
      setOcrValue("");
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (step === "result" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

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

      const fullFile = new File([blob], filename, {
        type: "image/jpeg",
      });

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

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          imageBase64: croppedBase64,
          scanType: scanType,
        }),
      });

      const data = await res.json();

      if (data.success && data.number) {
        setOcrValue(data.number);
      } else {
        toast.warning("หาตัวเลขไม่พบ กรุณาพิมพ์เอง");
        setOcrValue("");
      }

      setStep("result");
    } catch (error) {
      log.error("Scanning Error:", error);
      toast.error("ระบบสแกนขัดข้อง");
      setStep("camera");
      startCamera();
    }
  };

  const handleSubmit = async () => {
    if (!file || ocrValue.length !== EXPECTED_DIGITS) {
      toast.error(`กรุณาระบุตัวเลขให้ครบ ${EXPECTED_DIGITS} หลัก`);
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    await onConfirm(ocrValue, file);
    setIsSubmitting(false);
    onClose();
  };

  const handleRetake = () => {
    setStep("camera");
    setPreview(null);
    setFile(null);
    startCamera();
  };

  if (!isOpen) return null;

  const isComplete = ocrValue.length === EXPECTED_DIGITS;

  return (
    <div className="fixed inset-0 z-60 flex justify-center bg-black/80">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl duration-200 sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between bg-white px-5 py-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">
            {scanType === "WATER" ? "💧 สแกนมิเตอร์น้ำ" : "⚡ สแกนมิเตอร์ไฟ"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 text-center">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-indigo-700">
              ห้อง {roomNumber}
            </h2>
            <p className="font-medium text-slate-600">{tenantName}</p>
          </div>
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
                {isComplete ? (
                  <p className="mb-3 text-sm font-bold text-emerald-400">
                    ✅ ตรวจสอบความถูกต้อง
                  </p>
                ) : (
                  <p className="mb-3 flex animate-pulse items-center gap-1 text-sm font-bold text-amber-400">
                    <AlertTriangle size={16} />
                    ได้เลขไม่ครบ เติมให้เต็ม {EXPECTED_DIGITS}หลัก
                  </p>
                )}
                <div className="relative w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={EXPECTED_DIGITS}
                    value={ocrValue}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                      setOcrValue(onlyNums);
                    }}
                    className={`w-full rounded-2xl border-4 bg-white py-4 text-center text-5xl font-black tracking-[0.2em] text-slate-800 transition-all outline-none ${isComplete ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]" : "border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]"}`}
                    placeholder="00000"
                  />
                  <Edit3
                    className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
                    size={24}
                  />
                </div>
                <p className="mt-3 text-sm text-white/80">
                  สแกนได้{" "}
                  <span className="font-bold text-white">
                    {ocrValue.length}
                  </span>{" "}
                  / {EXPECTED_DIGITS}หลัก
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white p-6 pt-0">
          {step === "camera" ? (
            <div className="mt-6 flex gap-4">
              <button
                onClick={onSkip}
                className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200"
              >
                ข้าม
              </button>
              <button
                onClick={takePictureAndScan}
                disabled={!isCameraReady}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
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
                className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <RefreshCw size={20} className="mx-auto" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || step === "processing" || !isComplete}
                className={`flex flex-[3] items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition active:scale-95 ${isComplete ? "bg-emerald-500 hover:bg-emerald-600" : "cursor-not-allowed bg-slate-300 opacity-70"}`}
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
