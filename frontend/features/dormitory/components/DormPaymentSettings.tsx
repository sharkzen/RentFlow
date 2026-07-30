"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  Building2,
  ChevronDown,
  Smartphone,
  IdCard,
  Landmark,
} from "lucide-react";
import { DormFormData } from "@/features/dormitory";

interface PaymentSettingsProps {
  formData: DormFormData;
  updateField: (field: keyof DormFormData, value: any) => void;
}

export const THAI_BANKS = [
  {
    id: "kbank",
    name: "ธนาคารกสิกรไทย (KBANK)",
    logo: "/banks/kbank.png",
  },
  {
    id: "scb",
    name: "ธนาคารไทยพาณิชย์ (SCB)",
    logo: "/banks/scb.png",
  },
  {
    id: "bbl",
    name: "ธนาคารกรุงเทพ (BBL)",
    logo: "/banks/bbl.png",
  },
  {
    id: "ktb",
    name: "ธนาคารกรุงไทย (KTB)",
    logo: "/banks/ktb.png",
  },
  {
    id: "bay",
    name: "ธนาคารกรุงศรีอยุธยา (BAY)",
    logo: "/banks/bay.png",
  },
  {
    id: "ttb",
    name: "ธนาคารทหารไทยธนชาต (TTB)",
    logo: "/banks/ttb.png",
  },
  {
    id: "gsb",
    name: "ธนาคารออมสิน (GSB)",
    logo: "/banks/gsb.png",
  },
  {
    id: "baac",
    name: "ธ.ก.ส. (BAAC)",
    logo: "/banks/baac.png",
  },
  {
    id: "ghb",
    name: "ธนาคารอาคารสงเคราะห์ (GHB)",
    logo: "/banks/ghb.png",
  },
  {
    id: "uob",
    name: "ธนาคารยูโอบี (UOB)",
    logo: "/banks/uob.png",
  },
  {
    id: "cimb",
    name: "ธนาคารซีไอเอ็มบี ไทย (CIMB)",
    logo: "/banks/cimb.png",
  },
  {
    id: "kkp",
    name: "ธนาคารเกียรตินาคินภัทร (KKP)",
    logo: "/banks/kkp.png",
  },
  {
    id: "lhb",
    name: "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
    logo: "/banks/lhb.png",
  },
  {
    id: "ibank",
    name: "ธนาคารอิสลามแห่งประเทศไทย (IBank)",
    logo: "/banks/ibank.png",
  },
];

const Label = ({ icon: Icon, children }: any) => (
  <label className="text-foreground mb-1.5 flex items-center gap-2 text-sm font-semibold">
    {Icon && <Icon size={16} className="text-muted" />}
    {children}
  </label>
);

const Input = ({ className, ...props }: any) => (
  <input
    className={`border-border bg-background text-foreground placeholder:text-muted focus:bg-surface w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none ${className}`}
    {...props}
  />
);

const BankSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedBank = THAI_BANKS.find((b) => b.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all focus:outline-none ${isOpen ? "bg-surface border-indigo-500 ring-2 ring-indigo-100" : "border-border bg-background hover:bg-border/40"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedBank ? (
          <div className="flex items-center gap-3">
            <img
              src={selectedBank.logo}
              alt={selectedBank.id}
              className="border-border bg-surface h-6 w-6 rounded-full border object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/banks/default.png";
              }}
            />
            <span className="text-foreground">{selectedBank.name}</span>
          </div>
        ) : (
          <span className="text-muted">เลือกธนาคาร...</span>
        )}
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="border-border bg-surface absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 shadow-lg">
          {THAI_BANKS.map((bank) => (
            <div
              key={bank.id}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-red-50/20 ${value === bank.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground"}`}
              onClick={() => {
                onChange(bank.id);
                setIsOpen(false);
              }}
            >
              <img
                src={bank.logo}
                alt={bank.id}
                className="border-border bg-surface h-6 w-6 rounded-full border object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/banks/default.png")
                }
              />
              <span className="text-sm">{bank.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PROMPTPAY_TYPES = [
  {
    id: "",
    name: "-- ไม่ระบุ --",
    icon: Wallet,
  },
  {
    id: "PHONE",
    name: "เบอร์โทรศัพท์",
    icon: Smartphone,
  },
  {
    id: "ID_CARD",
    name: "บัตรประชาชน",
    icon: IdCard,
  },
  {
    id: "E_WALLET",
    name: "E-Wallet ID",
    icon: Landmark,
  },
];

const PromptPayTypeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected =
    PROMPTPAY_TYPES.find((t) => t.id === value) ?? PROMPTPAY_TYPES[0];
  const SelectedIcon = selected.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all focus:outline-none ${isOpen ? "bg-surface border-indigo-500 ring-2 ring-indigo-100" : "border-border bg-background hover:bg-border/40"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <SelectedIcon size={16} className="text-muted" />
          <span className={value ? "text-foreground" : "text-muted"}>
            {selected.name}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="border-border bg-surface absolute z-10 mt-1 w-full overflow-auto rounded-lg border py-1 shadow-lg">
          {PROMPTPAY_TYPES.map((type) => {
            const TypeIcon = type.icon;

            return (
              <div
                key={type.id}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-50/20 ${value === type.id ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground"}`}
                onClick={() => {
                  onChange(type.id);
                  setIsOpen(false);
                }}
              >
                <TypeIcon size={16} className="text-muted" />
                <span className="text-sm">{type.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function DormPaymentSettings({
  formData,
  updateField,
}: PaymentSettingsProps) {
  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
        <CreditCard size={16} />
        ตั้งค่าบัญชีรับเงิน
      </h3>
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h4 className="text-muted mb-2 text-xs font-bold">บัญชีธนาคาร</h4>
        </div>
        <div className="relative z-20">
          <Label icon={Building2}>
            ชื่อธนาคาร <span className="text-red-500">*</span>
          </Label>
          <BankSelect
            value={formData.bankName || ""}
            onChange={(val) => updateField("bankName", val)}
          />
        </div>
        <div>
          <Label>
            เลขที่บัญชี <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.bankAccount}
            onChange={(e: any) => updateField("bankAccount", e.target.value)}
            placeholder="xxx-x-xxxxx-x"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label>
            ชื่อบัญชี <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.bankHolder}
            onChange={(e: any) => updateField("bankHolder", e.target.value)}
            placeholder="ชื่อเจ้าของบัญชี"
            required
          />
        </div>
      </div>
      <div className="border-border border-t pt-5"></div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h4 className="text-muted mb-2 text-xs font-bold">
            พร้อมเพย์ (PromptPay)
          </h4>
        </div>
        <div>
          <Label icon={Wallet}>ประเภทพร้อมเพย์</Label>
          <PromptPayTypeSelect
            value={formData.promptPayType || ""}
            onChange={(val) => updateField("promptPayType", val)}
          />
        </div>
        <div>
          <Label>เลขพร้อมเพย์ / เบอร์โทร</Label>
          <Input
            value={formData.promptPayValue}
            onChange={(e: any) => updateField("promptPayValue", e.target.value)}
            placeholder="08xxxxxxxx / 1xxxxxxxxxxxx"
          />
        </div>
        <div className="md:col-span-2">
          <Label>ชื่อบัญชีพร้อมเพย์</Label>
          <Input
            value={formData.promptPayHolder}
            onChange={(e: any) =>
              updateField("promptPayHolder", e.target.value)
            }
            placeholder="ชื่อเจ้าของบัญชีพร้อมเพย์ (ถ้าไม่ระบุจะใช้ชื่อบัญชีธนาคาร)"
          />
        </div>
      </div>
    </div>
  );
}
