"use client";
import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Facebook,
  Copy,
  ExternalLink,
  User,
  Check,
} from "lucide-react";

interface ContactCardProps {
  contact?: {
    name: string;
    phone: string | null;
    lineId: string | null;
    facebook: string | null;
  };
}

export default function ContactCard({ contact }: ContactCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const contactName = contact?.name || "เจ้าหน้าที่ดูแลหอพัก";

  return (
    <div className="border-border bg-surface rounded-3xl border p-6 shadow-sm">
      <div className="border-border mb-6 flex items-center gap-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
          <User size={24} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-muted text-[10px] font-bold tracking-wider uppercase">
            Contact Info
          </span>
          <h3 className="text-foreground text-lg font-bold">{contactName}</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {contact?.phone ? (
          <button
            onClick={() => handleCopy(contact.phone!, "phone")}
            className="group border-border bg-background hover:bg-surface relative flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 transition-all hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <Phone size={18} />
              </div>
              <div className="text-left">
                <p className="text-muted text-[10px] font-medium">
                  เบอร์โทรศัพท์
                </p>
                <p className="text-foreground text-sm font-bold">
                  {contact.phone}
                </p>
              </div>
            </div>
            <div className="relative flex h-8 w-24 items-center justify-end pr-2">
              <div
                className={`text-muted absolute flex items-center gap-1 text-xs font-medium transition-all duration-300 ${copiedField === "phone" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100 group-hover:text-emerald-500"}`}
              >
                <span className="hidden sm:inline">คัดลอก</span>
                <Copy size={16} />
              </div>
              <div
                className={`absolute flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-600 transition-all duration-300 ${copiedField === "phone" ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
              >
                <Check size={14} />
                <span>คัดลอกแล้ว</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="border-border flex w-full items-center gap-4 rounded-2xl border border-dashed p-3.5 opacity-60">
            <div className="bg-background text-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Phone size={18} />
            </div>
            <span className="text-muted text-sm">ไม่ระบุเบอร์โทร</span>
          </div>
        )}
        {contact?.lineId && (
          <button
            onClick={() => handleCopy(contact.lineId!, "line")}
            className="group border-border bg-background hover:bg-surface relative flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 transition-all hover:border-green-200 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 transition-colors group-hover:bg-[#06C755] group-hover:text-white">
                <MessageCircle size={18} />
              </div>
              <div className="text-left">
                <p className="text-muted text-[10px] font-medium">Line ID</p>
                <p className="text-foreground text-sm font-bold">
                  {contact.lineId}
                </p>
              </div>
            </div>
            <div className="relative flex h-8 w-24 items-center justify-end pr-2">
              <div
                className={`text-muted absolute flex items-center gap-1 text-xs font-medium transition-all duration-300 ${copiedField === "line" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100 group-hover:text-[#06C755]"}`}
              >
                <span className="hidden sm:inline">คัดลอก</span>
                <Copy size={16} />
              </div>
              <div
                className={`absolute flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-600 transition-all duration-300 ${copiedField === "line" ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
              >
                <Check size={14} />
                <span>คัดลอกแล้ว</span>
              </div>
            </div>
          </button>
        )}
        {contact?.facebook && (
          <a
            href={contact.facebook}
            target="_blank"
            rel="noreferrer"
            className="group border-border bg-background hover:bg-surface relative flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 transition-all hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-[#1877F2] group-hover:text-white">
                <Facebook size={18} />
              </div>
              <div className="text-left">
                <p className="text-muted text-[10px] font-medium">Facebook</p>
                <p className="text-foreground max-w-37.5 truncate text-sm font-bold">
                  ติดต่อผ่านเพจ
                </p>
              </div>
            </div>
            <div className="text-muted flex items-center gap-1 pr-2 transition-colors group-hover:text-[#1877F2]">
              <ExternalLink size={16} />
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
