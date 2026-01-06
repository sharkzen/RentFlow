"use client";
import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Plus,
  X,
  Home,
  DollarSign,
  FileText,
  Wind,
  Snowflake,
  CheckCircle2,
} from "lucide-react";

enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

interface RoomFormData {
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  description?: string;
}

interface CreateRoomProps {
  dormId: string | null;
  dormName: string;
  onSuccess?: () => void;
}

export default function CreateRoomWithDialog({
  dormId,
  dormName,
  onSuccess,
}: CreateRoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,

    formState: { errors, isSubmitting },
  } = useForm<RoomFormData>({
    defaultValues: {
      type: RoomType.AIR,
      basePrice: 0,
    },
  });

  const selectedType = watch("type");

  const toggleModal = () => {
    if (!dormId) {
      alert("กรุณาเลือกหอพักก่อนสร้างห้อง");
      return;
    }

    if (isOpen) reset();

    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const onSubmit = async (data: RoomFormData) => {
    try {
      // payload ที่จะส่งไป API
      const payload = {
        ...data,
        dormitoryId: dormId,
      };

      console.log("Submitting:", payload);

      // TODO: ใส่ Logic เรียก API ตรงนี้
      // await RoomService.createRoom(payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setIsOpen(false);
      reset();

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="my-2 flex justify-end">
        <button
          onClick={toggleModal}
          disabled={!dormId}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 ${!dormId ? "cursor-not-allowed bg-gray-400 opacity-70" : "cursor-pointer bg-linear-to-r from-blue-600 to-blue-500 shadow-blue-200 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"}`}
        >
          <Plus className="h-5 w-5 transition-transform duration-300" />
          <span>สร้างห้องพัก</span>
        </button>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/60 p-4 transition-all"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="animate-in fade-in zoom-in-95 relative w-full max-w-lg transform rounded-xl bg-white shadow-2xl transition-all duration-200"
          >
            <div className="border-b border-slate-100 p-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    สร้างห้องพักใหม่
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    กำลังสร้างในหอพัก:
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                      <Home className="h-3 w-3" />
                      {dormName || "ไม่ระบุ"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleModal}
                  className="cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 p-6 pt-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  ประเภทห้อง
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setValue("type", RoomType.AIR)}
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${selectedType === RoomType.AIR ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <Snowflake
                      className={`h-6 w-6 ${selectedType === RoomType.AIR ? "text-blue-500" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-semibold">
                      ห้องแอร์ (AIR)
                    </span>
                    {selectedType === RoomType.AIR && (
                      <div className="absolute top-2 right-2 text-blue-500">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => setValue("type", RoomType.FAN)}
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${selectedType === RoomType.FAN ? "border-orange-500 bg-orange-50/50 text-orange-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <Wind
                      className={`h-6 w-6 ${selectedType === RoomType.FAN ? "text-orange-500" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-semibold">
                      ห้องพัดลม (FAN)
                    </span>
                    {selectedType === RoomType.FAN && (
                      <div className="absolute top-2 right-2 text-orange-500">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    เลขห้อง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น A101"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all outline-none placeholder:text-slate-400 focus:ring-2 ${errors.roomNumber ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                    {...register("roomNumber", {
                      required: true,
                    })}
                  />
                  {errors.roomNumber && (
                    <span className="text-xs text-red-500">
                      กรุณาระบุเลขห้อง
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      className={`w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none placeholder:text-slate-400 focus:ring-2 ${errors.basePrice ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                      {...register("basePrice", {
                        required: true,
                        min: 0,
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.basePrice && (
                    <span className="text-xs text-red-500">
                      ระบุราคาให้ถูกต้อง
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  รายละเอียด (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  {...register("description")}
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={toggleModal}
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "ยืนยันสร้างห้อง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
