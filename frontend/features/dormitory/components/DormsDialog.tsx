"use client";
import { Dormitory, DormFormData } from "@/features/dormitory";
import { descriptionJsonToText, parseDescription } from "@/lib/text";

import {
  X,
  MapPin,
  Info,
  DollarSign,
  Zap,
  Droplets,
  Calendar,
  AlertCircle,
  Home,
  Save,
  Check,
  Trash2,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Image as ImageIcon,
  Phone,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOnClickOutside } from "usehooks-ts";
import ImageSection from "./ImageSection";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { RemoveScroll } from "react-remove-scroll";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendError";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import InfoTooltip from "@/lib/ui/InfoTooltip";
import Link from "next/link";
import DormPaymentSettings from "./DormPaymentSettings";
import DormContactSettings from "./DormContactSettings";

interface DormPaymentSetting {
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  promptPayType?: string;
  promptPayValue?: string;
}

interface DormsDialogProps {
  dorm: Dormitory & {
    paymentSetting?: DormPaymentSetting;
  };
  onClose: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

const Label = ({ icon: Icon, children, required, optional }: any) => (
  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
    {Icon && <Icon size={16} className="text-slate-400" />}
    {children}
    {required && <span className="text-red-500">*</span>}
    {optional && (
      <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span>
    )}
  </label>
);

const Input = ({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) => (
  <input
    className={`w-full rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:outline-none ${
      error
        ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
    } ${className}`}
    {...props}
  />
);

type StepId = "general" | "contact" | "pricing" | "billing" | "images";

const FIELD_META: Partial<
  Record<
    keyof DormFormData,
    { step: StepId; label: string; type: "text" | "number" }
  >
> = {
  name: { step: "general", label: "ชื่อหอพัก", type: "text" },
  address: { step: "general", label: "ที่อยู่", type: "text" },
  mapUrl: { step: "general", label: "ลิงก์ Google Maps", type: "text" },
  description: { step: "general", label: "คำอธิบาย", type: "text" },
  roomPrice: { step: "pricing", label: "ราคาห้องเช่า", type: "number" },
  waterRate: { step: "pricing", label: "ค่าน้ำ", type: "number" },
  electricRate: { step: "pricing", label: "ค่าไฟ", type: "number" },
};

const STEPS: { id: StepId; label: string; icon: any }[] = [
  { id: "general", label: "ข้อมูลทั่วไป", icon: Home },
  { id: "contact", label: "ข้อมูลติดต่อ", icon: Phone },
  { id: "pricing", label: "ราคา & ค่าใช้จ่าย", icon: DollarSign },
  { id: "billing", label: "รอบบิล & ชำระเงิน", icon: CreditCard },
  { id: "images", label: "รูปภาพ", icon: ImageIcon },
];

const THAI_MONTHS_SHORT = [
  "มกรา",
  "กุมภา",
  "มีนา",
  "เมษา",
  "พฤษภา",
  "มิถุนา",
  "กรกฎา",
  "สิงหา",
  "กันยา",
  "ตุลา",
  "พฤศจิกา",
  "ธันวา",
];

const DUE_MONTH_OFFSETS = [
  { value: 0, label: "ชำระภายในเดือนที่ออกบิล" },
  { value: 1, label: "ชำระเดือนถัดไป" },
];

const DueMonthOffsetSelect = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

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
    DUE_MONTH_OFFSETS.find((o) => o.value === value) ?? DUE_MONTH_OFFSETS[1];

  const focusOption = (index: number) => {
    const clamped =
      (index + DUE_MONTH_OFFSETS.length) % DUE_MONTH_OFFSETS.length;
    optionRefs.current[clamped]?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault();
      setIsOpen(true);
      requestAnimationFrame(() => focusOption(0));
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(index - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`flex h-10.5 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-sm transition-all focus:outline-none ${isOpen ? "border-indigo-500 bg-white ring-2 ring-indigo-100" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="text-slate-900">{selected.label}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {DUE_MONTH_OFFSETS.map((option, index) => (
            <button
              key={option.value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-indigo-50 ${value === option.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-700"}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StepDropdown = ({
  value,
  onChange,
  completion,
}: {
  value: StepId;
  onChange: (id: StepId) => void;
  completion: Record<StepId, boolean>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

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

  const activeIndex = STEPS.findIndex((s) => s.id === value);
  const active = STEPS[activeIndex];
  const ActiveIcon = active.icon;

  const focusOption = (index: number) => {
    const clamped = (index + STEPS.length) % STEPS.length;
    optionRefs.current[clamped]?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault();
      setIsOpen(true);
      requestAnimationFrame(() => focusOption(0));
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(index - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none ${isOpen ? "border-indigo-500 bg-white ring-2 ring-indigo-100" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
            {activeIndex + 1}
          </span>
          <ActiveIcon size={15} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{active.label}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = completion[step.id];
            const isActive = step.id === value;
            return (
              <button
                key={step.id}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left ${isActive ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                onClick={() => {
                  onChange(step.id);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, idx)}
              >
                <span
                  className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isDone
                        ? "bg-emerald-50 text-emerald-600"
                        : "border border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isDone && !isActive ? <Check size={12} /> : idx + 1}
                </span>
                <StepIcon size={15} className="text-slate-400" />
                <span className="text-sm">{step.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function DormsDialog({
  dorm,
  onClose,
  onEdit,
  onRefresh,
}: DormsDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("general");
  const [showAdvancedFees, setShowAdvancedFees] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<keyof DormFormData>>(
    new Set(),
  );
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);

  useHotkeys("esc", () => {
    if (!isDeleteDialogOpen) onClose();
  });

  const closeRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(closeRef, () => {
    if (!isDeleteDialogOpen) {
      onClose();
    }
  });

  const [initialData, setInitialData] = useState<DormFormData | null>(null);
  const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  const [formData, setFormData] = useState<DormFormData>({
    id: dorm.id,
    name: dorm.name ?? "",
    description: descriptionJsonToText(dorm.description),
    address: dorm.address ?? "",
    contacts: (dorm.contacts ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? "",
      phone: c.phone,
    })),
    lineId: dorm.lineId ?? "",
    lineType: dorm.lineType ?? "PERSONAL",
    facebook: dorm.facebook ?? "",
    mapUrl: dorm.mapUrl ?? "",
    roomPrice: dorm.settings?.roomPrice ?? 0,
    waterRate: dorm.settings?.waterRate ?? 0,
    electricRate: dorm.settings?.electricRate ?? 0,
    commonFee: dorm.settings?.commonFee ?? 0,
    lateFee: dorm.settings?.lateFee ?? 0,
    dueDay: dorm.settings?.dueDay ?? 1,
    dueMonthOffset: dorm.settings?.dueMonthOffset ?? 1,
    bankName: dorm.paymentSetting?.bankName ?? "",
    bankAccount: dorm.paymentSetting?.bankAccount ?? "",
    bankHolder: dorm.paymentSetting?.bankHolder ?? "",
    promptPayType: dorm.paymentSetting?.promptPayType ?? "",
    promptPayValue: dorm.paymentSetting?.promptPayValue ?? "",
  });

  useEffect(() => {
    setInitialData({
      ...formData,
    });
    // เปิดส่วน "เพิ่มเติม" อัตโนมัติถ้ามีค่าติดมาจากเดิมอยู่แล้ว
    if (
      (dorm.settings?.commonFee ?? 0) > 0 ||
      (dorm.settings?.lateFee ?? 0) > 0
    ) {
      setShowAdvancedFees(true);
    }
  }, []);

  const updateField = useCallback((field: keyof DormFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFieldErrors((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  // ฟังก์ชันตัวช่วยสำหรับจัดการ Number Input ให้รับค่าว่างได้ และไม่ติดลบ
  const handleNumberChange = useCallback(
    (field: keyof DormFormData, value: string) => {
      if (value === "") {
        updateField(field, ""); // ยอมให้ช่องว่างเปล่าได้
        return;
      }
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        updateField(field, num);
      }
    },
    [updateField],
  );

  // ฟังก์ชันบล็อคไม่ให้พิมพ์เครื่องหมาย -, +, e, E เข้าไปได้เลย
  const preventInvalidNumberKeys = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (["-", "+", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    },
    [],
  );

  // เช็คว่าแต่ละ step กรอกข้อมูลจำเป็นครบหรือยัง เพื่อโชว์ติ๊กถูกที่แถบด้านซ้าย
  const stepCompletion = useMemo<Record<StepId, boolean>>(
    () => ({
      general:
        !!formData.name &&
        !!formData.address &&
        !!formData.mapUrl &&
        !!formData.description &&
        formData.description.trim() !== "",
      contact:
        (formData.contacts ?? []).some((c) => c.phone.trim() !== "") &&
        (!!formData.lineId?.trim() || !!formData.facebook?.trim()),
      pricing:
        !!formData.roomPrice &&
        Number(formData.roomPrice) > 0 &&
        !!formData.waterRate &&
        Number(formData.waterRate) > 0 &&
        !!formData.electricRate &&
        Number(formData.electricRate) > 0,
      billing: !!formData.dueDay,
      images: true,
    }),
    [formData],
  );

  // ตัวอย่างวันครบกำหนดชำระ อ้างอิงเดือนปัจจุบัน เพื่อให้เข้าใจ dueDay + dueMonthOffset ได้ง่ายขึ้น
  const dueDateExample = useMemo(() => {
    const day = Number(formData.dueDay);
    if (!day || day < 1 || day > 31) {
      return "กรอกวันที่ครบกำหนดชำระ เพื่อดูตัวอย่างรอบบิล";
    }

    const now = new Date();
    const billMonth = THAI_MONTHS_SHORT[now.getMonth()];
    const dueMonth =
      THAI_MONTHS_SHORT[
        (now.getMonth() + Number(formData.dueMonthOffset)) % 12
      ];

    if (Number(formData.dueMonthOffset) === 0) {
      return `เช่น บิลเดือน${billMonth} จะกำหนดชำระไม่เกินวันที่ ${day} ${dueMonth} (เดือนเดียวกัน)`;
    }

    return `เช่น ตอนนี้เดือน${billMonth} จะกำหนดชำระไม่เกินวันที่ ${day} ${dueMonth}`;
  }, [formData.dueDay, formData.dueMonthOffset]);

  const proceedSave = async () => {
    if (initialData && isEqual(initialData, formData)) {
      onClose();
      onRefresh?.();
      return;
    }

    // จัดระเบียบตัวเลขก่อนส่งเข้า Backend เพื่อป้องกันบัค (กรณีตั้งทิ้งไว้เป็น "")
    const payload: DormFormData = {
      ...formData,
      roomPrice: Number(formData.roomPrice) || 0,
      waterRate: Number(formData.waterRate) || 0,
      electricRate: Number(formData.electricRate) || 0,
      commonFee: Number(formData.commonFee) || 0,
      lateFee: Number(formData.lateFee) || 0,
      dueDay: Number(formData.dueDay) || 1,
      description: parseDescription(formData.description),

      contacts: (formData.contacts ?? [])
        .filter((c) => c.phone.trim() !== "")
        .map((c) => ({ name: c.name?.trim() || undefined, phone: c.phone.trim() })),
    };

    try {
      await toast.promise(DormService.updateDorm(payload), {
        pending: "กําลังบันทึกข้อมูล...",
        success: "บันทึกข้อมูลเรียบร้อย",
        error: "เกิดข้อผิดพลาดในการบันทึก",
      });

      onEdit?.();
      onClose();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  const handleSave = async () => {
    // ตรวจสอบฟิลด์ที่บังคับกรอกทั้งหมด แล้วพากลับไปหน้าแรกที่ยังกรอกไม่ครบ
    const missing: {
      field: keyof DormFormData;
      step: StepId;
      label: string;
    }[] = [];

    (Object.keys(FIELD_META) as (keyof DormFormData)[]).forEach((field) => {
      const meta = FIELD_META[field]!;
      const value = formData[field];
      const isEmpty =
        meta.type === "number"
          ? !value || Number(value) <= 0
          : !value || String(value).trim() === "";

      if (isEmpty) missing.push({ field, step: meta.step, label: meta.label });
    });

    if (missing.length > 0) {
      setFieldErrors(new Set(missing.map((m) => m.field)));
      setActiveStep(missing[0].step);
      toast.error(
        `กรุณากรอกข้อมูลให้ครบ: ${missing.map((m) => m.label).join(", ")}`,
      );
      return;
    }

    const hasContactPhone = (formData.contacts ?? []).some(
      (c) => c.phone.trim() !== "",
    );
    const hasLineOrFacebook =
      !!formData.lineId?.trim() || !!formData.facebook?.trim();

    if (!hasContactPhone || !hasLineOrFacebook) {
      setActiveStep("contact");
      toast.error(
        !hasContactPhone
          ? "กรุณากรอกเบอร์โทรผู้ติดต่ออย่างน้อย 1 เบอร์"
          : "กรุณากรอก Line ID หรือ Facebook อย่างน้อย 1 ช่องทาง",
      );
      return;
    }

    setFieldErrors(new Set());

    // ตั้งค่าบัญชีรับเงินไม่บังคับ แต่ถ้ายังไม่ได้กรอกเลยจะถามยืนยันก่อนบันทึก
    const hasPaymentSetting = !!(
      formData.bankName?.trim() ||
      formData.bankAccount?.trim() ||
      formData.bankHolder?.trim() ||
      formData.promptPayValue?.trim()
    );

    if (!hasPaymentSetting) {
      setIsPaymentConfirmOpen(true);
      return;
    }

    await proceedSave();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await toast.promise(DormService.deleteDorm(dorm.id), {
        pending: "กําลังลบหอพัก...",
        success: "ลบหอพักเรียบร้อย",

        error: {
          render({ data }: any) {
            const errorData = data?.response?.data;
            const errorCode = errorData?.code;

            if (errorCode === "DORM_HAS_DEPENDENCIES")
              return "ไม่สามารถลบได้: เนื่องจากยังมีห้องพักหรือผู้เช่าอยู่ในระบบ";

            if (errorCode === "FORBIDDEN_ACCESS")
              return "คุณไม่มีสิทธิ์ลบหอพักนี้";

            return errorData?.message || "เกิดข้อผิดพลาดในการลบหอพัก";
          },
        },
      });

      onEdit?.();
      onClose();
    } catch (error: any) {
      log.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  return (
    <RemoveScroll>
      <div className="fixed inset-0 z-50 flex justify-center bg-slate-900/40 sm:items-center sm:p-4">
        <div
          ref={closeRef}
          className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-800">
                แก้ไขข้อมูลหอพัก
              </h2>
              <Link
                href={`/dorms/${dorm.slug}`}
                target="_blank"
                className="text-sm text-blue-500 underline"
              >
                ดูห้องพัก
              </Link>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden bg-slate-50/50">
            {/* แถบขั้นตอนด้านซ้าย */}
            <nav className="hidden w-52 shrink-0 space-y-1 overflow-y-auto border-r border-slate-100 bg-white p-3 sm:block">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === step.id;
                const isDone = stepCompletion[step.id];
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isDone
                            ? "bg-emerald-50 text-emerald-600"
                            : "border border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isDone && !isActive ? <Check size={12} /> : idx + 1}
                    </span>
                    <span className="flex-1">{step.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* แถบขั้นตอนแบบ dropdown สำหรับจอเล็ก */}
              <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 sm:hidden">
                <StepDropdown
                  value={activeStep}
                  onChange={setActiveStep}
                  completion={stepCompletion}
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="p-6"
              >
                {activeStep === "general" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        ข้อมูลทั่วไป
                      </h3>
                      <p className="text-sm text-slate-500">
                        ชื่อ ที่อยู่ และรายละเอียดที่ผู้เช่าจะเห็นในหน้าประกาศ
                      </p>
                    </div>
                    <div>
                      <Label required>ชื่อหอพัก</Label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="เช่น หอพักสุขใจ เรสซิเดนซ์"
                        error={fieldErrors.has("name")}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <Label required icon={MapPin}>
                          ที่อยู่
                        </Label>
                        <Input
                          value={formData.address}
                          onChange={(e) =>
                            updateField("address", e.target.value)
                          }
                          error={fieldErrors.has("address")}
                        />
                      </div>
                      <div>
                        <Label required>
                          ลิงก์ Google Maps
                          <InfoTooltip>
                            <p className="font-semibold text-slate-800">
                              วิธีปักหมุดให้ตรงตำแหน่งจริง
                            </p>
                            <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                              <li>
                                เปิด Google Maps แล้วเลื่อนแผนที่ไปยังหอพัก
                              </li>
                              <li>
                                กดค้าง (long-press) บนตำแหน่งหอพักตรงจุดเป๊ะๆ
                                เพื่อปักหมุดเอง
                              </li>
                              <li>กด Share แล้วคัดลอกลิงก์มาวางในช่องนี้</li>
                            </ol>
                            <p className="mt-1.5 text-amber-600">
                              อย่าเสิร์ชหาชื่อหอแล้วกด Share ทันที
                              เพราะอาจได้ลิงก์ของสถานที่ใกล้เคียงที่ไม่ตรงจริง
                            </p>
                          </InfoTooltip>
                        </Label>
                        <Input
                          value={formData.mapUrl}
                          onChange={(e) =>
                            updateField("mapUrl", e.target.value)
                          }
                          error={fieldErrors.has("mapUrl")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label required icon={Info}>
                        คำอธิบาย
                      </Label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        rows={5}
                        className={`w-full resize-none rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:outline-none ${
                          fieldErrors.has("description")
                            ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                        }`}
                        placeholder="เช่น หอพักสะดวก มีที่จอดรถ ร่มรื่น ใกล้มหาวิทยาลัย..."
                      />
                    </div>
                  </div>
                )}

                {activeStep === "contact" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        ข้อมูลติดต่อ
                      </h3>
                      <p className="text-sm text-slate-500">
                        เบอร์โทร Line และ Facebook ที่ผู้เช่าจะใช้ติดต่อหอพักนี้
                      </p>
                    </div>
                    <DormContactSettings
                      formData={formData}
                      updateField={updateField}
                    />
                  </div>
                )}

                {activeStep === "pricing" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        ราคา & ค่าใช้จ่าย
                      </h3>
                      <p className="text-sm text-slate-500">
                        ตั้งราคาเริ่มต้นและอัตราค่าน้ำ-ไฟ
                        ระบบจะใช้คำนวณบิลอัตโนมัติ
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div>
                        <Label required icon={DollarSign}>
                          ราคาห้องเช่า(ราคาเริ่มต้น)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            value={formData.roomPrice}
                            onChange={(e) =>
                              handleNumberChange("roomPrice", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="pr-14"
                            placeholder="0"
                            error={fieldErrors.has("roomPrice")}
                          />
                          <span className="absolute top-2.5 right-3 text-xs text-slate-400">
                            บาท/ด.
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label required icon={Zap}>
                          ค่าไฟ
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            value={formData.electricRate}
                            onChange={(e) =>
                              handleNumberChange("electricRate", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="pr-16"
                            placeholder="0"
                            error={fieldErrors.has("electricRate")}
                          />
                          <span className="absolute top-2.5 right-3 text-xs text-slate-400">
                            บาท/หน่วย
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label required icon={Droplets}>
                          ค่าน้ำ
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            value={formData.waterRate}
                            onChange={(e) =>
                              handleNumberChange("waterRate", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="pr-16"
                            placeholder="0"
                            error={fieldErrors.has("waterRate")}
                          />
                          <span className="absolute top-2.5 right-3 text-xs text-slate-400">
                            บาท/หน่วย
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvancedFees((v) => !v)}
                      className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-indigo-600"
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${showAdvancedFees ? "rotate-90" : ""}`}
                      />
                      ค่าใช้จ่ายเพิ่มเติม (ส่วนกลาง, ค่าปรับ)
                    </button>

                    {showAdvancedFees && (
                      <div className="grid grid-cols-1 gap-5 rounded-lg border border-slate-100 bg-white p-4 sm:grid-cols-2">
                        <div>
                          <Label icon={Info} optional>
                            ค่าส่วนกลาง
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={formData.commonFee}
                              onChange={(e) =>
                                handleNumberChange("commonFee", e.target.value)
                              }
                              onKeyDown={preventInvalidNumberKeys}
                              className="pr-14"
                              placeholder="0"
                            />
                            <span className="absolute top-2.5 right-3 text-xs text-slate-400">
                              บาท/ด.
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label icon={AlertCircle} optional>
                            ค่าปรับชำระล่าช้า
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={formData.lateFee}
                              onChange={(e) =>
                                handleNumberChange("lateFee", e.target.value)
                              }
                              onKeyDown={preventInvalidNumberKeys}
                              className="pr-14"
                              placeholder="0"
                            />
                            <span className="absolute top-2.5 right-3 text-xs text-slate-400">
                              บาท/วัน
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeStep === "billing" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        รอบบิล & การชำระเงิน
                      </h3>
                      <p className="text-sm text-slate-500">
                        กำหนดวันครบกำหนดและบัญชีที่ผู้เช่าโอนเข้า
                        (ตั้งค่าบัญชีรับเงินภายหลังได้)
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <Label required icon={Calendar}>
                          ชำระไม่เกินวันที่
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.dueDay}
                          onChange={(e) =>
                            handleNumberChange("dueDay", e.target.value)
                          }
                          onKeyDown={preventInvalidNumberKeys}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label icon={Info}>รอบการชำระ</Label>
                        <DueMonthOffsetSelect
                          value={Number(formData.dueMonthOffset)}
                          onChange={(val) => updateField("dueMonthOffset", val)}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-slate-600">
                      <Info
                        size={16}
                        className="mt-0.5 shrink-0 text-indigo-500"
                      />
                      <span>{dueDateExample}</span>
                    </div>
                    <DormPaymentSettings
                      formData={formData}
                      updateField={updateField}
                    />
                  </div>
                )}

                {activeStep === "images" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                        รูปภาพหอพัก
                        <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-sm text-slate-500">
                        รูปแรกจะถูกใช้เป็นภาพปกในหน้ารายการและหน้าประกาศ
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-slate-600">
                      <ImageIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      <span>
                        ต้องมีรูปภาพอย่างน้อย 1 รูป จึงจะสามารถเปิดเผยแพร่
                        (Public) หอพักนี้ได้
                      </span>
                    </div>
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white">
                      <ImageSection dormId={dorm.id} />
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={18} className="transition group-hover:scale-110" />
              <span>ลบหอพัก</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700"
              >
                <Save size={18} />
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="ต้องการลบหอพักนี้?"
        description={`คุณแน่ใจหรือไม่ที่จะลบข้อมูล "${formData.name}"`}
        type="error"
        confirmText="ยืนยันลบ"
        cancelText="ไม่, เก็บไว้"
        isLoading={isDeleting}
      />
      <ConfirmDialog
        isOpen={isPaymentConfirmOpen}
        onClose={() => {
          setIsPaymentConfirmOpen(false);
          setActiveStep("billing");
        }}
        onConfirm={() => {
          setIsPaymentConfirmOpen(false);
          proceedSave();
        }}
        title="ยังไม่ได้ตั้งค่าบัญชีรับเงิน"
        description="คุณยังไม่ได้กรอกข้อมูลบัญชี/พร้อมเพย์สำหรับรับชำระเงิน ผู้เช่าจะยังไม่เห็นช่องทางโอนเงินจนกว่าจะตั้งค่า ต้องการบันทึกข้อมูลต่อเลยหรือไม่?"
        type="warning"
        confirmText="บันทึกต่อเลย"
        cancelText="กลับไปตั้งค่า"
      />
    </RemoveScroll>
  );
}
