"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";

import {
  X,
  Save,
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
  Zap,
  Droplets,
} from "lucide-react";

import { RoomService } from "@/features/room/services/room.service";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { showBackendError } from "@/lib/backendError";
import { useClickOutsideModal } from "@/lib/hooks/useClickOutsideModal";
import { useScrollLock } from "usehooks-ts";
import log from "@/lib/logger";
import {
  EditFormData,
  EditRoomProps,
  RoomStatus,
  RoomType,
} from "@/features/room/types";
import { CustomSelect } from "./CustomSelect";

export default function EditRoomDialog({
  room,
  isOpen,
  onClose,
  onSuccess,
}: EditRoomProps) {
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
        electricMeterDigits: room.meterSetting?.electricMeterDigits ?? 5,
        waterMeterDigits: room.meterSetting?.waterMeterDigits ?? "",
      });
    }
  }, [isOpen, room, reset]);

  const onSubmit = async (data: EditFormData) => {
    const toastId = toast.loading("กำลังตรวจสอบและบันทึก...");

    try {
      const payload = {
        ...data,
        floor: Number(data.floor),
        basePrice: Number(data.basePrice),
        status: isOccupied ? RoomStatus.OCCUPIED : data.status,
        electricMeterDigits: Number(data.electricMeterDigits),
        waterMeterDigits: data.waterMeterDigits
          ? Number(data.waterMeterDigits)
          : null,
      };

      await RoomService.updateRoom(room.id, payload);

      toast.update(toastId, {
        render: "บันทึกข้อมูลเรียบร้อย",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });

      onClose();
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
        render: `${showBackendError(code)}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
      });
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { modalRef } = useClickOutsideModal({
    isOpen: isOpen && !isConfirmOpen,
    onClose: onClose,
  });

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

      onClose();
      onSuccess?.();
    } catch (error) {
      log.error("Failed to delete room:", error);
    }
  };

  if (!isOpen) return null;

  useScrollLock();

  return (
    <>
      <div className="fixed inset-0 z-[999] flex sm:items-center sm:justify-center sm:p-4">
        <div className="fixed inset-0 bg-black/20" onClick={onClose} />
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="border-border bg-surface animate-in zoom-in-95 relative flex max-h-screen w-full flex-col overflow-y-auto border shadow-lg duration-200 max-sm:min-h-screen sm:max-h-[90vh] sm:max-w-lg sm:rounded-xl"
        >
          <button
            onClick={onClose}
            className="text-muted hover:bg-background hover:text-foreground absolute top-4 right-4 cursor-pointer rounded-full p-1.5 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="border-border border-b p-5 pr-12">
            <h3 className="text-foreground text-lg font-bold">
              แก้ไขข้อมูลห้องพัก
            </h3>
            <div className="text-muted mt-2 space-y-1 text-xs">
              <p>
                ชื่อหอ:{" "}
                <span className="font-semibold text-blue-600">
                  {room?.dormitory?.name || "-"}
                </span>
              </p>
              <p>
                ห้อง:{" "}
                <span className="font-semibold text-blue-600">
                  {room?.roomNumber}
                </span>
              </p>
              {room?.status === RoomStatus.OCCUPIED && room?.tenants?.[0] && (
                <p>
                  ผู้เช่า:{" "}
                  <span className="text-foreground font-medium">
                    {room.tenants[0].firstName} {room.tenants[0].lastName}
                  </span>
                </p>
              )}
            </div>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-muted text-xs font-medium">
                    ชั้น <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("floor", {
                        required: true,

                        onChange: (e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                        },
                      })}
                      onClick={(e) => e.stopPropagation()}
                      className="border-border w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="ชั้น"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted text-xs font-medium">
                    เลขห้อง <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                    <input
                      {...register("roomNumber", {
                        required: true,
                      })}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:ring-2 ${errors.roomNumber ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-border focus:border-blue-500 focus:ring-blue-100"}`}
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
                  <label className="text-muted text-xs font-medium">
                    ประเภทห้อง
                  </label>
                  <CustomSelect
                    value={watch("type")}
                    onChange={(val: string) =>
                      setValue("type", val as RoomType)
                    }
                    options={typeOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted text-xs font-medium">
                    ราคา <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("basePrice", {
                        required: true,
                        min: 0,

                        onChange: (e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                        },
                      })}
                      onClick={(e) => e.stopPropagation()}
                      className="border-border w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
              <div className="border-border bg-background grid grid-cols-2 gap-4 rounded-xl border p-4">
                <div className="col-span-2">
                  <h4 className="text-foreground text-sm font-semibold">
                    การตั้งค่ามิเตอร์
                  </h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted text-xs font-medium">
                    จำนวนหลักมิเตอร์ไฟ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Zap className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("electricMeterDigits", {
                        required: true,
                        min: 1,

                        onChange: (e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                        },
                      })}
                      onClick={(e) => e.stopPropagation()}
                      className="border-border bg-surface w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="เช่น 5"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-red-600">
                    หลักมิเตอร์น้ำที่ใช้คำนวน
                  </label>
                  <div className="relative">
                    <Droplets className="text-muted absolute top-2.5 left-3 h-4 w-4" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("waterMeterDigits", {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                        },
                      })}
                      onClick={(e) => e.stopPropagation()}
                      className="border-border bg-surface w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="ไม่ระบุ"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-muted flex items-center gap-1.5 text-xs font-medium">
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
                  onChange={(val: string) =>
                    setValue("status", val as RoomStatus)
                  }
                  options={statusOptions}
                  disabled={isOccupied}
                  icon={<Activity className="h-4 w-4" />}
                />
                {isOccupied ? (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-100 bg-yellow-50/50 p-2.5 text-xs text-yellow-700 dark:bg-yellow-50/20 dark:text-white">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    <p>
                      ห้องนี้มีผู้เช่าอยู่ <b>ไม่สามารถเปลี่ยนสถานะได้</b>{" "}
                      ต้องแจ้งย้ายออกในระบบก่อน
                    </p>
                  </div>
                ) : (
                  <div className="bg-background text-muted mt-2 flex items-start gap-2 rounded-lg p-2.5 text-xs">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>
                      หากต้องการเปลี่ยนเป็น <b>"มีผู้เช่า"</b>{" "}
                      กรุณาไปที่เมนูจัดการผู้เช่า
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-muted text-xs font-medium">
                  รายละเอียดเพิ่มเติม
                </label>
                <div className="relative">
                  <FileText className="text-muted absolute top-3 left-3 h-4 w-4" />
                  <textarea
                    {...register("description")}
                    rows={3}
                    onClick={(e) => e.stopPropagation()}
                    className="border-border w-full resize-none rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="ระบุข้อมูลเพิ่มเติม..."
                  />
                </div>
              </div>
            </div>
            <div className="border-border bg-surface mt-auto flex items-center justify-between border-t p-6 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmOpen(true);
                }}
                disabled={isSubmitting || isOccupied}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${isOccupied ? "text-muted cursor-not-allowed" : "cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600"}`}
              >
                <Trash2 className="h-4 w-4" />
                ลบห้องพัก
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-muted hover:bg-background cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={(e) => e.stopPropagation()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
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
