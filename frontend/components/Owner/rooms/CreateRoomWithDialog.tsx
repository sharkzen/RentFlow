"use client";
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  X,
  Home,
  DollarSign,
  Wind,
  Snowflake,
  Trash2,
  Layers,
} from "lucide-react";
import { RoomService } from "@/features/room/services/room.service";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import { AxiosError } from "axios";
import { showBackendError } from "@/lib/backendErrorMsg";
import { useClickOutsideModal } from "@/lib/useClickOutsideModal";

enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

interface RoomFormItem {
  floor: string;
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  description?: string;
}

interface RoomFormValues {
  rooms: RoomFormItem[];
}

interface CreateRoomProps {
  dormId: string | null;
  dormName: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function CreateRoomWithDialog({
  dormId,
  dormName,
  onSuccess,
}: CreateRoomProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,

    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    defaultValues: {
      rooms: [
        {
          floor: "",
          roomNumber: "",
          type: RoomType.AIR,
          basePrice: 0,
          description: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rooms",
  });

  const toggleModal = () => {
    if (!dormId) {
      alert("กรุณาเลือกหอพักก่อนสร้างห้อง");
      return;
    }

    if (isOpen) {
      reset({
        rooms: [
          {
            floor: "",
            roomNumber: "",
            type: RoomType.AIR,
            basePrice: 0,
            description: "",
          },
        ],
      });
    }

    setIsOpen(!isOpen);
  };

  const handleAddRoom = () => {
    const currentRooms = watch("rooms");
    const lastRoom = currentRooms[currentRooms.length - 1];

    append({
      floor: lastRoom?.floor || "",
      roomNumber: "",
      type: lastRoom?.type || RoomType.AIR,
      basePrice: lastRoom?.basePrice || 0,
      description: lastRoom?.description || "",
    });
  };

  const onSubmit = async (data: RoomFormValues) => {
    if (!dormId) return;

    const toastId = toast.loading("กำลังบันทึกข้อมูล...");

    try {
      const payload = {
        dormitoryId: dormId,

        rooms: data.rooms.map((r) => ({
          floor: r.floor,
          roomNumber: r.roomNumber,
          type: r.type,
          basePrice: Number(r.basePrice),
          description: r.description,
        })),
      };

      const response = await RoomService.createBulkRooms(payload);
      const dupes = response.duplicatedRooms || [];
      const count = response.createdCount || 0;

      if (count === 0 && dupes.length > 0) {
        toast.update(toastId, {
          render: `❌ สร้างไม่สำเร็จ! ห้อง ${dupes.join(", ")} มีอยู่แล้ว`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });

        return;
      }

      if (dupes.length > 0) {
        toast.update(toastId, {
          render: `สร้างได้ ${count} ห้อง (ข้ามห้องซ้ำ: ${dupes.join(", ")})`,
          type: "warning",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      } else {
        toast.update(toastId, {
          render: `${showBackendError(response.message || "CREATE_SUCCESS")}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }

      setIsOpen(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      const err = error as AxiosError<{
        message: string;
      }>;

      const message = err.response?.data?.message || error.message;

      toast.update(toastId, {
        render: `${showBackendError(message)}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });

      log.error("CreateRoomWithDialog:onSubmit", error.message);
    }
  };

  const { modalRef } = useClickOutsideModal({
    isOpen,
    onClose: () => setIsOpen(false),
  });

  return (
    <>
      <div className="my-2 flex justify-end">
        <button
          onClick={toggleModal}
          disabled={!dormId}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ${!dormId ? "cursor-not-allowed bg-gray-400 opacity-70" : "cursor-pointer bg-linear-to-r from-blue-600 to-blue-500 shadow-blue-200 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"}`}
        >
          <Plus className="h-5 w-5" />
          <span>สร้างห้องพัก</span>
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center overflow-hidden bg-black/60 p-4 transition-all">
          <div
            ref={modalRef}
            className="flex h-[85vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  จัดการห้องพัก
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Home className="h-3 w-3" />
                  หอพัก:{" "}
                  <span className="font-semibold text-blue-600">
                    {dormName}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleModal}
                className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            ข้อมูลห้องพัก
                          </span>
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-slate-400 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            ชั้น <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Layers className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="number"
                              step={1}
                              min={0}
                              {...register(`rooms.${index}.floor`, {
                                required: "กรุณากรอกชั้น",
                                valueAsNumber: true,

                                validate: (value) => {
                                  const num = Number(value);

                                  if (isNaN(num)) return "ชั้นต้องเป็นตัวเลข";

                                  return true;
                                },
                              })}
                              className={`w-full rounded-lg border py-2 pr-3 pl-8 text-sm transition-all outline-none focus:ring-2 ${errors.rooms?.[index]?.floor ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            เลขห้อง <span className="text-red-500">*</span>
                          </label>
                          <input
                            {...register(`rooms.${index}.roomNumber`, {
                              required: true,
                            })}
                            placeholder="เช่น 101"
                            className={`w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none focus:ring-2 ${errors.rooms?.[index]?.roomNumber ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            ประเภท
                          </label>
                          <div className="relative">
                            <select
                              {...register(`rooms.${index}.type`)}
                              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value={RoomType.AIR}>
                                ห้องแอร์ (AIR)
                              </option>
                              <option value={RoomType.FAN}>
                                ห้องพัดลม (FAN)
                              </option>
                            </select>
                            <div className="pointer-events-none absolute top-2.5 right-3">
                              {watch(`rooms.${index}.type`) === RoomType.AIR ? (
                                <Snowflake className="h-4 w-4 text-blue-400" />
                              ) : (
                                <Wind className="h-4 w-4 text-orange-400" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            ราคา <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute top-2.5 left-2 h-4 w-4 text-slate-400" />
                            <input
                              type="number"
                              {...register(`rooms.${index}.basePrice`, {
                                required: "กรุณากรอกราคา",
                                valueAsNumber: true,

                                min: {
                                  value: 0,
                                  message: "ราคาต้องมากกว่าหรือเท่ากับ 0",
                                },

                                validate: (value) => {
                                  if (isNaN(Number(value)))
                                    return "ราคาต้องเป็นตัวเลข";

                                  return true;
                                },
                              })}
                              className="w-full rounded-lg border border-slate-200 py-2 pr-2 pl-7 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            รายละเอียด
                          </label>
                          <input
                            {...register(`rooms.${index}.description`)}
                            placeholder="Optional"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Plus className="h-5 w-5" />
                    เพิ่มห้องพักในชั้นนี้
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    กำลังสร้าง{" "}
                    <span className="font-bold text-slate-800">
                      {fields.length}
                    </span>{" "}
                    ห้อง
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={toggleModal}
                      disabled={isSubmitting}
                      className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:bg-blue-300"
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
