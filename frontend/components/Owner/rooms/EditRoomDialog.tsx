"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  X,
  Save,
  Pencil,
  Home,
  Layers,
  DollarSign,
  Snowflake,
  Wind,
  FileText,
  Activity,
  AlertTriangle,
  Info,
  Lock,
  ChevronDown,
  Check,
  Trash2,
} from "lucide-react";

import { RoomService } from "@/features/room/services/room.service";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { showBackendError } from "@/lib/backendErrorMsg";
import { useClickOutsideModal } from "@/lib/useClickOutsideModal";
import log from "@/lib/logger";

enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
}

interface EditRoomProps {
  room: any;
  onSuccess?: () => void;
}

interface EditFormData {
  roomNumber: string;
  floor: string | number;
  type: RoomType;
  basePrice: number;
  status: RoomStatus;
  description?: string;
}

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}

const CustomSelect = ({
  value,
  onChange,
  options,
  disabled = false,
  icon,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      {icon && (
        <div className="absolute top-2.5 left-3 text-gray-400">{icon}</div>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all outline-none ${icon ? "pl-10" : ""} ${disabled ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400" : isOpen ? "border-blue-500 bg-white ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption?.label || "เลือกข้อมูล"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 duration-100">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${option.value === value ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700 hover:bg-gray-50"} ${option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {option.value === value && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function EditRoomDialog({ room, onSuccess }: EditRoomProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,

    formState: { errors, isSubmitting },
  } = useForm<EditFormData>();

  const isOccupied = room?.status === RoomStatus.OCCUPIED;

  const typeOptions = [
    {
      value: RoomType.AIR,
      label: "ห้องแอร์",
      icon: <Snowflake className="h-4 w-4 text-blue-400" />,
    },
    {
      value: RoomType.FAN,
      label: "ห้องพัดลม",
      icon: <Wind className="h-4 w-4 text-orange-400" />,
    },
  ];

  const statusOptions = [
    {
      value: RoomStatus.AVAILABLE,
      label: "ว่าง (Available)",
      icon: <div className="h-2 w-2 rounded-full bg-emerald-500" />,
    },
    {
      value: RoomStatus.OCCUPIED,
      label: "มีผู้เช่า (Occupied)",
      icon: <div className="h-2 w-2 rounded-full bg-blue-500" />,
      disabled: true,
    },
    {
      value: RoomStatus.MAINTENANCE,
      label: "ปิดปรับปรุง (Maintenance)",
      icon: <div className="h-2 w-2 rounded-full bg-red-500" />,
    },
  ];

  useEffect(() => {
    if (isOpen && room) {
      reset({
        roomNumber: room.roomNumber,
        floor: room.floor,
        type: room.type,
        basePrice: room.basePrice,
        status: room.status,
        description: room.description || "",
      });
    }
  }, [isOpen, room, reset]);

  const toggleModal = () => setIsOpen(!isOpen);

  const onSubmit = async (data: EditFormData) => {
    const toastId = toast.loading("กำลังตรวจสอบและบันทึก...");

    try {
      const payload = {
        ...data,
        floor: Number(data.floor),
        basePrice: Number(data.basePrice),
        status: isOccupied ? RoomStatus.OCCUPIED : data.status,
      };

      await RoomService.updateRoom(room.id, payload);

      toast.update(toastId, {
        render: "บันทึกข้อมูลเรียบร้อย ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });

      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      const err = error as AxiosError<{
        message: string;
      }>;

      const code = err.response?.data?.message || "INTERNAL_SERVER_ERROR";

      if (code === "DUPLICATE_ROOM_NUMBER") {
        setError("roomNumber", {
          type: "manual",
          message: "เลขห้องนี้ซ้ำกับห้องอื่นในระบบ",
        });
      }

      toast.update(toastId, {
        render: `❌ ${showBackendError(code)}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
      });
    }
  };

  const { modalRef } = useClickOutsideModal({
    isOpen,
    onClose: () => setIsOpen(false),
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getErrorMessage = (error: any) => {
    const code = error.response?.data?.message || "INTERNAL_SERVER_ERROR";

    switch (code) {
      case "CANNOT_DELETE_OCCUPIED_ROOM":
        return "ไม่สามารถลบห้องที่มีผู้เช่าอยู่ได้";
      case "FORBIDDEN":
        return "คุณไม่มีสิทธิ์ในการลบห้องนี้";
      case "ROOM_NOT_FOUND":
        return "ไม่พบข้อมูลห้องพัก (อาจถูกลบไปแล้ว)";
      default:
        return "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
    }
  };

  const handleDeleteRoom = async () => {
    setIsConfirmOpen(false);

    try {
      await toast.promise(RoomService.deleteRoom(room.id), {
        pending: "กำลังลบข้อมูลห้องพัก...",
        success: "ลบห้องพักเรียบร้อยแล้ว",

        error: {
          render({ data }: any) {
            return `${getErrorMessage(data)}`;
          },
        },
      });

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      log.error("Failed to delete room:", error);
    }
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className="group relative cursor-pointer rounded-lg bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200"
        title="แก้ไขข้อมูลห้อง"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 transition-all">
          <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
          <div
            ref={modalRef}
            className="animate-in zoom-in-95 relative flex w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-lg duration-200"
          >
            <div className="flex items-center justify-between border-b border-gray-50 p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  แก้ไขข้อมูลห้องพัก
                </h3>
                <p className="text-xs text-gray-500">
                  ห้อง:{" "}
                  <span className="font-semibold text-blue-600">
                    {room.roomNumber}
                  </span>
                </p>
              </div>
              <button
                onClick={toggleModal}
                className="cursor-pointer rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      ชั้น <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Layers className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                      <input
                        {...register("floor", {
                          required: true,
                        })}
                        className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="ชั้น"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      เลขห้อง <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Home className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                      <input
                        {...register("roomNumber", {
                          required: true,
                        })}
                        className={`w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:ring-2 ${errors.roomNumber ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"}`}
                        placeholder="เลขห้อง"
                      />
                    </div>
                    {errors.roomNumber && (
                      <span className="text-[10px] text-red-500">
                        {errors.roomNumber.message || "กรุณาระบุเลขห้อง"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      ประเภทห้อง
                    </label>
                    <CustomSelect
                      value={watch("type")}
                      onChange={(val) => setValue("type", val as RoomType)}
                      options={typeOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      ราคา
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        {...register("basePrice", {
                          required: true,
                          min: 0,
                        })}
                        className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    สถานะห้อง
                    {isOccupied && (
                      <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    value={watch("status")}
                    onChange={(val) => setValue("status", val as RoomStatus)}
                    options={statusOptions}
                    disabled={isOccupied}
                    icon={<Activity className="h-4 w-4" />}
                  />
                  {isOccupied ? (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-100 bg-yellow-50/50 p-2.5 text-xs text-yellow-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                      <p>
                        ห้องนี้มีผู้เช่าอยู่ <b>ไม่สามารถเปลี่ยนสถานะได้</b>{" "}
                        ต้องแจ้งย้ายออกในระบบก่อน
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-500">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>
                        หากต้องการเปลี่ยนเป็น <b>"มีผู้เช่า"</b>{" "}
                        กรุณาไปที่เมนูจัดการผู้เช่า
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <div className="relative">
                    <FileText className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-200 py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="ระบุข้อมูลเพิ่มเติม..."
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isSubmitting || isOccupied}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isOccupied ? "cursor-not-allowed text-gray-300" : "text-red-500 hover:bg-red-50 hover:text-red-600"}`}
                  title={
                    isOccupied ? "ไม่สามารถลบห้องที่มีผู้เช่าได้" : "ลบห้องพัก"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  ลบห้องพัก
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleModal}
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      "กำลังบันทึก..."
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        บันทึก
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteRoom}
        title="ยืนยันการลบห้องพัก"
        description={`คุณต้องการลบห้อง "${room.roomNumber}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        type="error"
      />
    </>
  );
}
