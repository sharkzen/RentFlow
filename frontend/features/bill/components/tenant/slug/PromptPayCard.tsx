import React, { useRef, useState } from "react";
import {
  Download,
  ScanLine,
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "react-toastify";

interface PromptPayCardProps {
  qrData: string;
  amount: number;
  accountName: string;
}

export const PromptPayCard = ({
  qrData,
  amount,
  accountName,
}: PromptPayCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      setIsSaving(true);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `PromptPay-${amount}-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Save image failed:", error);
      toast.error("ไม่สามารถบันทึกรูปภาพได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative w-full max-w-[340px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-100">
        <div ref={cardRef} className="rounded-2xl bg-white">
          <div className="relative flex h-[85px] w-full items-center justify-between bg-[#1A3761] px-5 pt-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1 shadow-md">
                <ScanLine
                  className="text-[#1A3761]"
                  size={26}
                  strokeWidth={2.5}
                />
                <div className="absolute right-1 bottom-1 h-1.5 w-1.5 rounded-full bg-[#1A3761]"></div>
              </div>
              <div className="flex flex-col leading-none text-white">
                <span className="mb-0.5 text-[11px] font-medium opacity-90">
                  พร้อมเพย์
                </span>
                <span className="font-sans text-[16px] font-bold tracking-wide">
                  PromptPay
                </span>
              </div>
            </div>
            <div className="flex h-full flex-col items-end justify-center text-white">
              <div className="flex items-center gap-1.5 rounded-sm border-2 border-white/90 px-1.5 py-0.5">
                <div className="h-2.5 w-2.5 bg-white/90"></div>
                <div className="h-2.5 w-2.5 border border-white/90 bg-[#1A3761]"></div>
              </div>
              <span className="mt-1 text-[9px] font-bold tracking-widest opacity-90">
                THAI QR PAYMENT
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center px-6 pt-6 pb-6">
            <div className="mb-6 flex items-center gap-2 rounded-full border border-blue-100 bg-[#F0F7FF] px-4 py-1.5">
              <Smartphone size={16} className="text-[#1A3761]" />
              <span className="text-[12px] font-bold text-[#1A3761]">
                สแกนจ่ายได้ทุกธนาคาร
              </span>
              <CheckCircle2
                size={14}
                className="fill-emerald-50 text-emerald-500"
              />
            </div>
            <div className="group relative mb-6 p-1">
              <div className="absolute -top-1 -left-1 h-6 w-6 rounded-tl-md border-t-[3px] border-l-[3px] border-[#1A3761]"></div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-tr-md border-t-[3px] border-r-[3px] border-[#1A3761]"></div>
              <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-md border-b-[3px] border-l-[3px] border-[#1A3761]"></div>
              <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-br-md border-r-[3px] border-b-[3px] border-[#1A3761]"></div>
              <img
                src={qrData}
                alt="Payment QR"
                className="h-60 w-60 object-contain mix-blend-multiply"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
                <div className="text-md flex -rotate-12 items-center gap-1 rounded-md border border-red-200 bg-white/80 px-2 py-0.5 font-bold text-red-500 opacity-80">
                  <AlertCircle size={12} />
                  สำหรับชำระค่าห้องพักเท่านั้น
                </div>
              </div>
            </div>
            <div className="mb-5 w-full px-2 text-center">
              <p className="mb-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                ชื่อบัญชี (Account Name)
              </p>
              <h3 className="text-lg leading-snug font-bold break-words text-slate-800">
                {accountName}
              </h3>
            </div>
            <div className="relative mb-6 w-full border-t-2 border-dashed border-slate-200">
              <div className="absolute -top-2.5 -left-9 h-5 w-5 rounded-full bg-[#f8fafc]"></div>
              <div className="absolute -top-2.5 -right-9 h-5 w-5 rounded-full bg-[#f8fafc]"></div>
            </div>
            <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-slate-100 bg-[#F8FAFC] py-5">
              <p className="mb-1 text-[13px] font-semibold text-slate-500">
                จำนวนเงิน (Amount)
              </p>
              <div className="flex items-baseline gap-1.5 text-[#1A3761]">
                <span className="text-2xl font-bold">฿</span>
                <span className="text-[40px] leading-none font-black tracking-tighter">
                  {amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex h-3 w-full">
            <div className="w-1/3 bg-[#1A3761]"></div>
            <div className="w-1/3 bg-[#00589B]"></div>
            <div className="w-1/3 bg-[#1A3761]"></div>
          </div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={isSaving}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1A3761] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:bg-[#13294b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            กำลังบันทึก...
          </>
        ) : (
          <>
            <Download size={18} />
            บันทึกรูปภาพ
          </>
        )}
      </button>
    </div>
  );
};
