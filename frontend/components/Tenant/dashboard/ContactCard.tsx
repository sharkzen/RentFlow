"use client";
import { Phone, MessageCircle, Facebook, Clock, Copy } from "lucide-react";
import { toast } from "react-toastify";

interface ContactCardProps {
  contact?: {
    name: string;
    phone: string | null;
    lineId: string | null;
    facebook: string | null;
  };
}

export default function ContactCard({ contact }: ContactCardProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกเรียบร้อย");
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
          <img
            src={`https://ui-avatars.com/api/?name=${contact?.name || "Admin"}&background=random`}
            alt="Admin"
            className="rounded-full opacity-80"
          />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            {contact?.name || "นิติบุคคลอาคาร"}
          </h4>
          <p className="text-xs text-slate-500">ผู้ดูแลหอพัก</p>
        </div>
      </div>
      <div className="space-y-4">
        {contact?.phone ? (
          <div
            className="group flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
            onClick={() => handleCopy(contact.phone!)}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 text-emerald-500 shadow-sm">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">เบอร์โทรศัพท์</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.phone}
                </p>
              </div>
            </div>
            <Copy
              size={14}
              className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-3 text-center text-xs text-slate-400">
            ไม่ระบุเบอร์โทร
          </div>
        )}

        {contact?.lineId && (
          <div
            className="group flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
            onClick={() => handleCopy(contact.lineId!)}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 text-green-500 shadow-sm">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">LINE ID</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.lineId}
                </p>
              </div>
            </div>
            <Copy
              size={14}
              className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        )}

        {contact?.facebook && (
          <a
            href={contact.facebook}
            target="_blank"
            rel="noreferrer"
            className="group flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                <Facebook size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Facebook</p>
                <p className="max-w-[150px] truncate text-sm font-semibold text-slate-700">
                  ติดต่อผ่าน Facebook
                </p>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
