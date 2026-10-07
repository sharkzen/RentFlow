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
  Building2,
  ExternalLink,
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
import MapTutorialContent from "@/lib/ui/MapTutorialContent";
import Link from "next/link";
import DormPaymentSettings from "./DormPaymentSettings";
import LockedFinanceCard from "./LockedFinanceCard";
import { useOwnerBilling } from "@/features/billing/context/OwnerBillingContext";
import DormContactSettings from "./DormContactSettings";

interface DormPaymentSetting {
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  promptPayType?: string;
  promptPayValue?: string;
  promptPayHolder?: string;
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
  <label className="text-foreground mb-1.5 flex items-center gap-2 text-sm font-semibold">
    {Icon && <Icon size={16} className="text-muted" />}
    {children}
    {required && <span className="text-red-500">*</span>}
    {optional && (
      <span className="text-muted text-xs font-normal">(ไม่บังคับ)</span>
    )}
  </label>
);

const Input = ({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
}) => (
  <input
    className={`bg-background text-foreground placeholder:text-muted focus:bg-surface w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none ${error ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-100" : "border-border focus:border-indigo-500 focus:ring-indigo-100"} ${className}`}
    {...props}
  />
);

type StepId = "general" | "contact" | "pricing" | "billing" | "images";

const FIELD_META: Partial<
  Record<
    keyof DormFormData,
    {
      step: StepId;
      label: string;
      type: "text" | "number";
    }
  >
> = {
  name: {
    step: "general",
    label: "ชื่อหอพัก",
    type: "text",
  },

  address: {
    step: "general",
    label: "ที่อยู่",
    type: "text",
  },

  mapUrl: {
    step: "general",
    label: "ลิงก์ Google Maps",
    type: "text",
  },

  description: {
    step: "general",
    label: "คำอธิบาย",
    type: "text",
  },

  roomPrice: {
    step: "pricing",
    label: "ราคาห้องเช่า",
    type: "number",
  },

  waterRate: {
    step: "pricing",
    label: "ค่าน้ำ",
    type: "number",
  },

  electricRate: {
    step: "pricing",
    label: "ค่าไฟ",
    type: "number",
  },
};

const STEPS: {
  id: StepId;
  label: string;
  icon: any;
}[] = [
  {
    id: "general",
    label: "ข้อมูลทั่วไป",
    icon: Home,
  },
  {
    id: "contact",
    label: "ข้อมูลติดต่อ",
    icon: Phone,
  },
  {
    id: "pricing",
    label: "ราคา & ค่าใช้จ่าย",
    icon: DollarSign,
  },
  {
    id: "billing",
    label: "รอบบิล & ชำระเงิน",
    icon: CreditCard,
  },
  {
    id: "images",
    label: "รูปภาพ",
    icon: ImageIcon,
  },
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
  {
    value: 0,
    label: "ชำระภายในเดือนที่ออกบิล",
  },
  {
    value: 1,
    label: "ชำระเดือนถัดไป",
  },
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
        className={`flex h-10.5 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-sm transition-all focus:outline-none ${isOpen ? "bg-surface border-indigo-500 ring-2 ring-indigo-100" : "border-border bg-background hover:bg-border/40"}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="text-foreground">{selected.label}</span>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="border-border bg-surface absolute z-10 mt-1 w-full overflow-auto rounded-lg border py-1"
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
              className={`w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-indigo-50 ${value === option.value ? "bg-indigo-50 font-medium text-indigo-700" : "text-foreground"}`}
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
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none ${isOpen ? "bg-surface border-indigo-500 ring-2 ring-indigo-100" : "border-border bg-background hover:bg-border/40"}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
            {activeIndex + 1}
          </span>
          <ActiveIcon size={15} className="text-muted" />
          <span className="text-foreground font-semibold">{active.label}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="border-border bg-surface absolute z-10 mt-1 w-full overflow-hidden rounded-lg border py-1"
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
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left ${isActive ? "bg-indigo-50 font-semibold text-indigo-700" : "text-foreground hover:bg-background"}`}
                onClick={() => {
                  onChange(step.id);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, idx)}
              >
                <span
                  className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isActive ? "bg-indigo-600 text-white" : isDone ? "bg-emerald-50 text-emerald-600" : "border-border bg-surface text-muted border"}`}
                >
                  {isDone && !isActive ? <Check size={12} /> : idx + 1}
                </span>
                <StepIcon size={15} className="text-muted" />
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
  // ไม่มีแพ็คเกจที่ใช้งานอยู่: ตั้งค่าการเงิน (เลขบัญชี/พร้อมเพย์) ไม่ได้ ส่วนอื่นของหอตั้งได้ปกติ
  const { restricted: financeLocked } = useOwnerBilling();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("general");
  const [showAdvancedFees, setShowAdvancedFees] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<keyof DormFormData>>(
    new Set(),
  );
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [imageCount, setImageCount] = useState(dorm.images?.length ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  useHotkeys("esc", () => {
    if (!isDeleteDialogOpen && !isPaymentConfirmOpen) onClose();
  });

  const closeRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(closeRef, () => {
    if (!isDeleteDialogOpen && !isPaymentConfirmOpen) {
      onClose();
    }
  });

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
    waterBillingType: dorm.settings?.waterBillingType ?? "METERED",
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
    promptPayHolder: dorm.paymentSetting?.promptPayHolder ?? "",
  });

  useEffect(() => {
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

  const handleNumberChange = useCallback(
    (field: keyof DormFormData, value: string) => {
      if (value === "") {
        updateField(field, "");
        return;
      }

      const num = Number(value);

      if (!isNaN(num) && num >= 0) {
        updateField(field, num);
      }
    },
    [updateField],
  );

  const preventInvalidNumberKeys = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (["-", "+", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    },
    [],
  );

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
      billing:
        !!formData.dueDay &&
        (financeLocked ||
          !!formData.promptPayValue?.trim() ||
          (!!formData.bankName?.trim() && !!formData.bankAccount?.trim())),
      images: imageCount > 0,
    }),
    [formData, imageCount, financeLocked],
  );

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
        .map((c) => ({
          name: c.name?.trim() || undefined,
          phone: c.phone.trim(),
        })),
    };

    setIsSaving(true);

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
      toast.error(showBackendError(error?.response?.data?.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
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

      if (isEmpty)
        missing.push({
          field,
          step: meta.step,
          label: meta.label,
        });
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
    const hasPaymentSetting = !!(
      formData.bankName?.trim() ||
      formData.bankAccount?.trim() ||
      formData.bankHolder?.trim() ||
      formData.promptPayValue?.trim()
    );

    if (!hasPaymentSetting && !financeLocked) {
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
          className="bg-surface flex h-full w-full flex-col overflow-hidden ring-1 ring-slate-900/5 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
        >
          <div className="border-border relative border-b px-6 py-5">
            <button
              onClick={onClose}
              className="text-muted hover:bg-surface hover:text-foreground absolute top-5 right-5 cursor-pointer rounded-full p-2 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col gap-4 pr-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/30">
                  <Building2 size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-foreground text-xl leading-tight font-bold">
                    แก้ไขข้อมูลหอพัก
                  </h2>
                  <p className="text-muted mt-0.5 text-sm">
                    จัดการรายละเอียดและข้อมูลติดต่อ
                  </p>
                </div>
              </div>

              <Link
                href={`/dorms/${dorm.slug}`}
                target="_blank"
                className="bg-background border-border text-foreground inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow active:scale-95"
              >
                ดูหน้าหอพัก
                <ExternalLink size={16} className="text-blue-500" />
              </Link>
            </div>
          </div>
          <div className="bg-background/50 flex flex-1 overflow-hidden">
            <nav className="border-border bg-surface hidden w-52 shrink-0 space-y-1 overflow-y-auto border-r p-3 sm:block">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === step.id;
                const isDone = stepCompletion[step.id];

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-muted hover:bg-background"}`}
                  >
                    <span
                      className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isActive ? "bg-indigo-600 text-white" : isDone ? "bg-emerald-50 text-emerald-600" : "border-border bg-surface text-muted border"}`}
                    >
                      {isDone && !isActive ? <Check size={12} /> : idx + 1}
                    </span>
                    <span className="flex-1">{step.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="border-border bg-surface shrink-0 border-b px-4 py-3 sm:hidden">
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
                      <h3 className="text-foreground text-base font-bold">
                        ข้อมูลทั่วไป
                      </h3>
                      <p className="text-muted text-sm">
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
                          ลิงก์ Map หรือ ละติจูด
                          <InfoTooltip fullscreen>
                            <MapTutorialContent />
                          </InfoTooltip>
                        </Label>
                        <Input
                          value={formData.mapUrl}
                          onChange={(e) =>
                            updateField("mapUrl", e.target.value)
                          }
                          placeholder="https://maps.app.goo.gl/... หรือ 16.188169, 103.279746"
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
                        className={`bg-background text-foreground placeholder:text-muted focus:bg-surface w-full resize-none rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none ${fieldErrors.has("description") ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-100" : "border-border focus:border-indigo-500 focus:ring-indigo-100"}`}
                        placeholder="เช่น หอพักสะดวก มีที่จอดรถ ร่มรื่น ใกล้มหาวิทยาลัย..."
                      />
                    </div>
                  </div>
                )}
                {activeStep === "contact" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-foreground text-base font-bold">
                        ข้อมูลติดต่อ
                      </h3>
                      <p className="text-muted text-sm">
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
                  <div className="space-y-6">
                    <div className="border-border border-b pb-4">
                      <h3 className="text-foreground flex items-center gap-2.5 text-lg font-bold">
                        <div className="flex rounded-lg bg-indigo-100 p-1.5 text-indigo-600">
                          <DollarSign size={20} />
                        </div>
                        ราคา & ค่าใช้จ่าย
                      </h3>
                      <p className="text-muted mt-1.5 text-sm">
                        ตั้งราคาเริ่มต้นและอัตราค่าน้ำ-ไฟ
                        ระบบจะนำไปใช้คำนวณบิลอัตโนมัติ
                      </p>
                    </div>
                    <div className="border-border bg-surface rounded-xl border p-5">
                      <div className="max-w-md">
                        <Label required icon={DollarSign}>
                          ราคาห้องเช่า (เริ่มต้น)
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.roomPrice}
                            onChange={(e) =>
                              handleNumberChange("roomPrice", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="h-12 pr-16 pl-4 text-lg font-semibold text-indigo-700 transition-colors focus:border-indigo-500 focus:ring-indigo-100"
                            placeholder="0"
                            error={fieldErrors.has("roomPrice")}
                          />
                          <span className="text-muted absolute top-3.5 right-4 text-sm font-medium">
                            บาท/ด.
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="border-border bg-background rounded-xl border p-5">
                        <Label required icon={Zap}>
                          ค่าไฟ
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.electricRate}
                            onChange={(e) =>
                              handleNumberChange("electricRate", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="pr-20"
                            placeholder="0"
                            error={fieldErrors.has("electricRate")}
                          />
                          <span className="text-muted absolute top-2.5 right-3 text-xs">
                            บาท/หน่วย
                          </span>
                        </div>
                      </div>
                      <div className="border-border bg-background rounded-xl border p-5">
                        <Label required icon={Droplets}>
                          ค่าน้ำ
                        </Label>
                        <div className="bg-border/60 mt-2 mb-3 flex gap-1 rounded-lg p-1 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() =>
                              updateField("waterBillingType", "METERED")
                            }
                            className={`flex-1 cursor-pointer rounded-md py-1.5 transition-all duration-200 ${(formData.waterBillingType ?? "METERED") === "METERED" ? "bg-surface text-indigo-700 ring-1 ring-slate-900/5" : "text-muted hover:bg-border/50 hover:text-foreground"}`}
                          >
                            คิดตามหน่วย
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateField("waterBillingType", "FLAT_RATE")
                            }
                            className={`flex-1 cursor-pointer rounded-md py-1.5 transition-all duration-200 ${formData.waterBillingType === "FLAT_RATE" ? "bg-surface text-indigo-700 ring-1 ring-slate-900/5" : "text-muted hover:bg-border/50 hover:text-foreground"}`}
                          >
                            เหมาจ่าย
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            value={formData.waterRate}
                            onChange={(e) =>
                              handleNumberChange("waterRate", e.target.value)
                            }
                            onKeyDown={preventInvalidNumberKeys}
                            className="pr-20"
                            placeholder="0"
                            error={fieldErrors.has("waterRate")}
                          />
                          <span className="text-muted absolute top-2.5 right-3 text-xs">
                            {formData.waterBillingType === "FLAT_RATE"
                              ? "บาท/ด."
                              : "บาท/หน่วย"}
                          </span>
                        </div>
                        <p className="text-muted mt-2.5 text-[11px] leading-relaxed">
                          {formData.waterBillingType === "FLAT_RATE"
                            ? "ผู้เช่าจ่ายค่าน้ำเหมาจ่ายเท่ากันทุกเดือน ไม่ต้องจดมิเตอร์"
                            : "คำนวณบิลจาก: (หน่วยเดือนนี้ - หน่วยเดือนก่อน) × ราคา"}
                        </p>
                      </div>
                    </div>
                    <div className="border-border bg-surface overflow-hidden rounded-xl border transition-all">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFees((v) => !v)}
                        className={`flex w-full cursor-pointer items-center justify-between p-4 text-sm font-semibold transition-colors ${showAdvancedFees ? "bg-background text-indigo-700" : "text-muted hover:bg-background"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-md p-1 transition-colors ${showAdvancedFees ? "bg-indigo-100 text-indigo-600" : "bg-background text-muted"}`}
                          >
                            <Info size={16} />
                          </div>
                          ตั้งค่าเพิ่มเติม (ค่าส่วนกลาง, ค่าปรับล่าช้า)
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-muted transition-transform duration-300 ${showAdvancedFees ? "rotate-90 text-indigo-500" : ""}`}
                        />
                      </button>
                      {showAdvancedFees && (
                        <div className="border-border bg-background grid grid-cols-1 gap-5 border-t p-5 sm:grid-cols-2">
                          <div>
                            <Label icon={Info} optional>
                              ค่าส่วนกลาง
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                type="number"
                                min="0"
                                value={formData.commonFee}
                                onChange={(e) =>
                                  handleNumberChange(
                                    "commonFee",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={preventInvalidNumberKeys}
                                className="bg-surface pr-16"
                                placeholder="0"
                              />
                              <span className="text-muted absolute top-2.5 right-3 text-xs">
                                บาท/ด.
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label icon={AlertCircle} optional>
                              ค่าปรับชำระล่าช้า
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                type="number"
                                min="0"
                                value={formData.lateFee}
                                onChange={(e) =>
                                  handleNumberChange("lateFee", e.target.value)
                                }
                                onKeyDown={preventInvalidNumberKeys}
                                className="bg-surface pr-16"
                                placeholder="0"
                              />
                              <span className="text-muted absolute top-2.5 right-3 text-xs">
                                บาท/วัน
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeStep === "billing" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-foreground text-base font-bold">
                        รอบบิล & การชำระเงิน
                      </h3>
                      <p className="text-muted text-sm">
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
                    <div className="text-foreground flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-100/20">
                      <Info
                        size={16}
                        className="mt-0.5 shrink-0 text-indigo-500"
                      />
                      <span>{dueDateExample}</span>
                    </div>
                    {financeLocked ? (
                      <LockedFinanceCard />
                    ) : (
                      <DormPaymentSettings
                        formData={formData}
                        updateField={updateField}
                      />
                    )}
                  </div>
                )}
                {activeStep === "images" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
                        รูปภาพหอพัก
                        <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-muted text-sm">
                        รูปแรกจะถูกใช้เป็นภาพปกในหน้ารายการและหน้าประกาศ
                      </p>
                    </div>
                    <div className="text-foreground flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-50/20">
                      <ImageIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      <span>
                        ต้องมีรูปภาพอย่างน้อย 1 รูป จึงจะสามารถเปิดเผยแพร่
                        (Public) หอพักนี้ได้
                      </span>
                    </div>
                    <div className="border-border bg-surface rounded-lg border border-dashed">
                      <ImageSection dormId={dorm.id} onCountChange={setImageCount} />
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
          <div className="border-border bg-surface flex items-center justify-between border-t px-6 py-4 text-xs sm:text-sm">
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
                className="border-border bg-surface text-foreground hover:bg-background cursor-pointer rounded-lg border px-5 py-2.5 font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        onConfirm={async () => {
          await proceedSave();
          setIsPaymentConfirmOpen(false);
        }}
        title="ยังไม่ได้ตั้งค่าบัญชีรับเงิน"
        description="คุณยังไม่ได้กรอกข้อมูลบัญชี/พร้อมเพย์สำหรับรับชำระเงิน ผู้เช่าจะยังไม่เห็นช่องทางโอนเงินจนกว่าจะตั้งค่า ต้องการบันทึกข้อมูลต่อเลยหรือไม่?"
        type="warning"
        confirmText="บันทึกต่อเลย"
        cancelText="กลับไปตั้งค่า"
        isLoading={isSaving}
      />
    </RemoveScroll>
  );
}
