"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  ChevronDown,
  Check,
  Search,
} from "lucide-react";

import { RoomService } from "@/features/room/services/room.service";
import { toast } from "react-toastify";
import log from "@/lib/logger";
import { AxiosError } from "axios";
import { showBackendError } from "@/lib/backendErrorMsg";
import { useClickOutsideModal } from "@/lib/useClickOutsideModal";
import { Dormitory } from "@/features/dormitory";

enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

interface RoomTypeDropdownProps {
  value: RoomType;
  onChange: (value: RoomType) => void;
}

const RoomTypeDropdown = ({ value, onChange }: RoomTypeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    {
      value: RoomType.AIR,
      label: "ห้องแอร์ (AIR)",
      icon: <Snowflake className="h-4 w-4 text-blue-500" />,
      bg: "bg-blue-50 text-blue-700",
    },
    {
      value: RoomType.FAN,
      label: "ห้องพัดลม (FAN)",
      icon: <Wind className="h-4 w-4 text-orange-500" />,
      bg: "bg-orange-50 text-orange-700",
    },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-100 focus:outline-none ${isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
      >
        <div className="flex items-center gap-2">
          {selected.icon}
          <span className="font-medium text-slate-700">{selected.label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute z-10 mt-1 w-full rounded-lg border border-slate-100 bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm transition-colors ${value === option.value ? "bg-slate-100 font-semibold text-slate-800" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {value === option.value && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface DormSelectorProps {
  dorms: Dormitory[];
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const DormSelector = ({ dorms, value, onChange, error }: DormSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredDorms = useMemo(() => {
    return dorms.filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [dorms, searchTerm]);

  const selectedDorm = dorms.find((d) => d.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full sm:w-72" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none ${error ? "border-red-300 ring-red-100 focus:border-red-500" : isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:bg-gray-50"}`}
      >
        <span
          className={`truncate ${selectedDorm ? "font-medium text-slate-800" : "text-slate-500"}`}
        >
          {selectedDorm ? selectedDorm.name : "-- เลือกหอพัก --"}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหอ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pr-3 pl-8 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
            {filteredDorms.length === 0 ? (
              <div className="py-3 text-center text-xs text-gray-400">
                ไม่พบข้อมูล
              </div>
            ) : (
              filteredDorms.map((dorm) => {
                const isSelected = dorm.id === value;

                return (
                  <button
                    key={dorm.id}
                    type="button"
                    onClick={() => {
                      onChange(dorm.id);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSelected ? "bg-blue-50 font-medium text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className="truncate">{dorm.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface RoomFormItem {
  floor: string;
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  description?: string;
}

interface RoomFormValues {
  targetDormId?: string;
  rooms: RoomFormItem[];
}

interface CreateRoomProps {
  dormId?: string;
  dormName?: string;
  dorms?: Dormitory[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function CreateRoomWithDialog({
  dormId,
  dormName,
  dorms = [],
  onSuccess,
}: CreateRoomProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,

    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    defaultValues: {
      targetDormId: dormId || "",

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

  useEffect(() => {
    if (dormId) {
      setValue("targetDormId", dormId);
    }
  }, [dormId, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rooms",
  });

  const toggleModal = () => {
    if (isOpen) {
      reset({
        targetDormId: dormId || "",

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
    const finalDormId = dormId || data.targetDormId;

    if (!finalDormId) {
      toast.error("กรุณาเลือกหอพักที่จะสร้างห้อง");
      return;
    }

    const toastId = toast.loading("กำลังบันทึกข้อมูล...");

    try {
      const payload = {
        dormitoryId: finalDormId,

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
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-blue-200 transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-lg active:scale-95 max-sm:w-full`}
        >
          <Plus className="h-5 w-5" />
          <span>สร้างห้องพัก</span>
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex overflow-hidden bg-black/60 transition-all sm:items-center sm:justify-center sm:p-4">
          <div
            ref={modalRef}
            className="relative flex w-full flex-col bg-white sm:h-[85vh] sm:max-w-5xl sm:rounded-xl sm:shadow-2xl"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  จัดการห้องพัก
                </h3>
                <div className="mt-2 flex flex-col gap-2 text-sm text-slate-500 sm:mt-1 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">หอพัก:</span>
                  </div>
                  {dormId ? (
                    <span className="font-semibold text-blue-600">
                      {dormName}
                    </span>
                  ) : (
                    <div className="w-full sm:ml-2">
                      <input
                        type="hidden"
                        {...register("targetDormId", {
                          required: true,
                        })}
                      />
                      <DormSelector
                        dorms={dorms}
                        value={watch("targetDormId") || ""}
                        onChange={(val) => {
                          setValue("targetDormId", val);
                          trigger("targetDormId");
                        }}
                        error={!!errors.targetDormId}
                      />
                      {errors.targetDormId && (
                        <div className="mt-1 text-xs text-red-500">
                          * กรุณาเลือกหอพัก
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={toggleModal}
                className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:static"
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
                            className="cursor-pointer text-slate-400 transition-colors hover:text-red-500"
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
                          <RoomTypeDropdown
                            value={watch(`rooms.${index}.type`)}
                            onChange={(val) =>
                              setValue(`rooms.${index}.type`, val)
                            }
                          />
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
                            รายละเอียด(ถ้ามี)
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
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Plus className="h-5 w-5" />
                    เพิ่มห้อง
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
