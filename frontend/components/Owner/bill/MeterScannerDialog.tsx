"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";

import {
  X,
  Droplets,
  Zap,
  SkipForward,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { RoomService } from "@/features/room/services/room.service";
import { OcrSpaceService } from "@/features/owner/services/ocrspace.service";
import log from "@/lib/logger";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dormId: string;
  onComplete: (scannedData: any[]) => void;
}

type ScanStep = "SELECT_TYPE" | "SCANNING" | "FINISHED_ONE";

type UIFeedback = {
  status:
    | "IDLE"
    | "BLURRY"
    | "DARK"
    | "GLARE"
    | "NOT_FOUND"
    | "SUCCESS"
    | "ERROR";
  message: string;
};

export default function MeterScannerDialog({
  isOpen,
  onClose,
  dormId,
  onComplete,
}: Props) {
  const webcamRef = useRef<Webcam>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);

  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const [rooms, setRooms] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meterType, setMeterType] = useState<"WATER" | "ELECTRIC" | null>(null);
  const [scannedResults, setScannedResults] = useState<any[]>([]);
  const [step, setStep] = useState<ScanStep>("SELECT_TYPE");
  const [successValue, setSuccessValue] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<UIFeedback>({
    status: "IDLE",
    message: "เล็งให้อยู่ในกรอบ แล้วกดถ่าย",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && dormId) {
      fetchRooms();
      resetScanState("SELECT_TYPE", null);
    }
  }, [isOpen, dormId]);

  const resetScanState = (
    newStep: ScanStep,
    newType: "WATER" | "ELECTRIC" | null,
  ) => {
    setStep(newStep);
    setMeterType(newType);
    setCurrentIndex(0);
    setSuccessValue(null);
    setFrozenImage(null);

    setFeedback({
      status: "IDLE",
      message: "เล็งให้อยู่ในกรอบ แล้วกดถ่าย",
    });
  };

  const fetchRooms = async () => {
    try {
      const res = await RoomService.getRooms(dormId, "OCCUPIED");
      const sorted = res.sort((a: any, b: any) =>
        a.roomNumber.localeCompare(b.roomNumber),
      );
      setRooms(sorted);

      const initialResults = sorted.map((r: any) => ({
        roomId: r.id,
        roomNumber: r.roomNumber,
        tenantName: r.tenantName || "-",
        prevWater: r.lastWaterUnit,
        currentWater: "",
        waterImage: null,
        prevElectric: r.lastElectricUnit,
        currentElectric: "",
        electricImage: null,
        commonFee: r.commonFee,
      }));

      setScannedResults(initialResults);
    } catch (error) {
      log.error(error);
    }
  };

  const currentRoom = rooms[currentIndex];
  const isWater = meterType === "WATER";

  const handleNext = useCallback(() => {
    if (currentIndex < rooms.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFrozenImage(null);

      setFeedback({
        status: "IDLE",
        message: "เล็งให้อยู่ในกรอบ แล้วกดถ่าย",
      });
    } else {
      setStep("FINISHED_ONE");
    }
  }, [currentIndex, rooms.length]);

  const processSuccess = useCallback(
    (extractedValue: number, fullImageSrc: string) => {
      setFeedback({
        status: "SUCCESS",
        message: "บันทึกเรียบร้อย!",
      });

      setScannedResults((prev) => {
        const updated = [...prev];

        if (meterType === "WATER") {
          updated[currentIndex].currentWater = extractedValue;
          updated[currentIndex].waterImage = fullImageSrc;
        } else {
          updated[currentIndex].currentElectric = extractedValue;
          updated[currentIndex].electricImage = fullImageSrc;
        }

        return updated;
      });

      setSuccessValue(extractedValue);

      setTimeout(() => {
        setSuccessValue(null);
        setFrozenImage(null);
        handleNext();
      }, 1500);
    },
    [currentIndex, meterType, handleNext],
  );

  const getCroppedImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const video = webcamRef.current?.video;
      const viewfinder = viewfinderRef.current;

      if (!video || !viewfinder) return resolve("");

      const videoRect = video.getBoundingClientRect();
      const viewfinderRect = viewfinder.getBoundingClientRect();
      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;
      const sx = (viewfinderRect.left - videoRect.left) * scaleX;
      const sy = (viewfinderRect.top - videoRect.top) * scaleY;
      const sw = viewfinderRect.width * scaleX;
      const sh = viewfinderRect.height * scaleY;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      }

      resolve(canvas.toDataURL("image/jpeg", 1.0));
    });
  };

  const handleCapture = async () => {
    const video = webcamRef.current?.video;

    if (!video || !meterType) return;

    const fullFrame = webcamRef.current?.getScreenshot();

    if (!fullFrame) return;

    setFrozenImage(fullFrame);
    setIsScanning(true);

    setFeedback({
      status: "IDLE",
      message: "Gemini AI กำลังวิเคราะห์...",
    });

    const croppedBase64 = await getCroppedImage();
    const data = await OcrSpaceService.scanMeter(croppedBase64);

    if (data.success && data.value !== undefined) {
      processSuccess(data.value, fullFrame);
    } else {
      toast.error(data.message || "หาตัวเลขไม่พบ");

      setFeedback({
        status: "NOT_FOUND",
        message: data.message || "ลองเล็งใหม่",
      });

      setFrozenImage(null);
    }

    setIsScanning(false);
  };

  const uiConfig = (() => {
    switch (feedback.status) {
      case "BLURRY":
        return {
          color: "border-orange-500",
          text: "text-orange-500",
        };
      case "DARK":
      case "GLARE":
        return {
          color: "border-yellow-400",
          text: "text-yellow-400",
        };
      case "NOT_FOUND":
      case "ERROR":
        return {
          color: "border-red-500",
          text: "text-red-500",
        };
      case "SUCCESS":
        return {
          color: "border-green-500",
          text: "text-green-500",
        };
      default:
        return {
          color: "border-indigo-400",
          text: "text-indigo-400",
        };
    }
  })();

  if (!isOpen) return null;

  if (step === "SELECT_TYPE") {
    return (
      <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">
              เลือกมิเตอร์ที่จะเริ่มสแกน
            </h2>
            <button
              onClick={onClose}
              className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 p-6">
            <button
              onClick={() => resetScanState("SCANNING", "WATER")}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-blue-100 bg-blue-50 p-4 transition-all hover:border-blue-500 hover:shadow-md active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                <Droplets size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-blue-900">สแกนมิเตอร์น้ำ</h3>
              </div>
              <ArrowRight className="text-blue-400" />
            </button>
            <button
              onClick={() => resetScanState("SCANNING", "ELECTRIC")}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-yellow-100 bg-yellow-50 p-4 transition-all hover:border-yellow-500 hover:shadow-md active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-white">
                <Zap size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-yellow-900">สแกนมิเตอร์ไฟ</h3>
              </div>
              <ArrowRight className="text-yellow-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "FINISHED_ONE") {
    const nextType = isWater ? "ELECTRIC" : "WATER";

    return (
      <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">
            สแกนมิเตอร์{isWater ? "น้ำ" : "ไฟ"}ครบแล้ว!
          </h2>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => resetScanState("SCANNING", nextType)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-all active:scale-95 ${isWater ? "bg-yellow-500" : "bg-blue-500"}`}
            >
              {isWater ? <Zap size={20} /> : <Droplets size={20} />}สแกนมิเตอร์
              {isWater ? "ไฟ" : "น้ำ"}ต่อ
            </button>
            <button
              onClick={() => onComplete(scannedResults)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
            >
              ดูหน้าสรุปข้อมูล (Preview)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-white">
            ห้อง:{" "}
            <span className={isWater ? "text-blue-400" : "text-yellow-400"}>
              {currentRoom?.roomNumber}
            </span>
          </h2>
          <p className="text-sm text-gray-400">
            {currentIndex + 1}จาก {rooms.length}ห้อง
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex items-center justify-center bg-gray-800 py-3 shadow-md">
        <div
          className={`flex items-center gap-2 rounded-full px-6 py-2 text-lg font-bold ${isWater ? "border border-blue-500/50 bg-blue-500/20 text-blue-400" : "border border-yellow-500/50 bg-yellow-500/20 text-yellow-400"}`}
        >
          {isWater ? <Droplets size={20} /> : <Zap size={20} />}{" "}
          {isWater ? "มิเตอร์น้ำ" : "มิเตอร์ไฟ"}
          <span className="ml-2 text-sm font-normal text-gray-300">
            (ครั้งก่อน:{" "}
            {isWater
              ? currentRoom?.lastWaterUnit
              : currentRoom?.lastElectricUnit}
            )
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {frozenImage ? (
          <img
            src={frozenImage}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            alt="frozen camera frame"
          />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              aspectRatio:
                windowSize.height > 0
                  ? windowSize.width / windowSize.height
                  : 9 / 16,
            }}
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div
            ref={viewfinderRef}
            className={`relative h-20 w-72 rounded-xl border-4 ${uiConfig.color} shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] transition-colors duration-300`}
          >
            <div className="absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 bg-red-500/80" />
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-gray-900/80 px-5 py-2 backdrop-blur-md">
            {feedback.status !== "IDLE" && feedback.status !== "SUCCESS" && (
              <AlertTriangle size={18} className={uiConfig.text} />
            )}
            <span className={`text-sm font-bold ${uiConfig.text}`}>
              {feedback.message}
            </span>
          </div>
        </div>

        {isScanning && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Loader2
                size={48}
                className="mx-auto mb-4 animate-spin text-indigo-500"
              />
              <p className="text-lg font-bold text-white">กำลังประมวลผล...</p>
            </div>
          </div>
        )}

        {successValue !== null && (
          <div className="animate-in zoom-in absolute inset-0 z-40 flex flex-col items-center justify-center bg-green-500/90 backdrop-blur-sm duration-200">
            <CheckCircle2 size={64} className="mb-4 text-white" />
            <h2 className="mb-2 text-2xl font-bold text-white">
              บันทึกสำเร็จ!
            </h2>
            <div className="rounded-2xl bg-white px-8 py-3 shadow-lg">
              <span className="text-5xl font-black text-green-600">
                {successValue}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="z-10 flex items-center justify-between bg-gray-900 p-6 px-8 pb-8">
        <button
          onClick={handleNext}
          disabled={successValue !== null || isScanning}
          className="flex flex-col items-center text-gray-400 transition-colors hover:text-white disabled:opacity-50"
        >
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800">
            <SkipForward size={22} />
          </div>
          <span className="text-xs">ข้าม</span>
        </button>
        <button
          onClick={handleCapture}
          disabled={successValue !== null || isScanning}
          className="group flex flex-col items-center disabled:opacity-50"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-95">
            <div className="h-16 w-16 rounded-full bg-white transition-all" />
          </div>
          <span className="mt-3 text-sm font-bold tracking-wide text-white">
            กดถ่ายรูป
          </span>
        </button>
        <div className="w-14" />
      </div>
    </div>
  );
}
