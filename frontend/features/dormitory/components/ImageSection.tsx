"use client";
import React, { useState, useEffect } from "react";
import { X, ImagePlus, Star } from "lucide-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-toastify";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { DormitoryImage } from "@/features/dormitory";
import log from "@/lib/logger";
import { showBackendError } from "@/lib/backendError";

interface ImageSectionProps {
  dormId: string;
}

export default function ImageSection({ dormId }: ImageSectionProps) {
  const [images, setImages] = useState<DormitoryImage[]>([]);

  const fetchImages = async () => {
    try {
      const latest = await DormService.getDormImages(dormId);
      setImages(latest);
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [dormId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
  );

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    const remainingSlots = 5 - images.length;

    if (selectedFiles.length > remainingSlots) {
      toast.error(`เพิ่มได้อีก ${remainingSlots} รูปเท่านั้น`);
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    const isOverSize = selectedFiles.some((file) => file.size > MAX_SIZE);

    if (isOverSize) {
      toast.error("มีบางไฟล์ขนาดเกิน 10MB กรุณาเลือกใหม่");
      e.target.value = "";
      return;
    }

    const uploadProcess = async () => {
      await DormService.uploadImages(dormId, selectedFiles);
      await fetchImages();
    };

    await toast.promise(uploadProcess(), {
      pending: "กำลังอัพโหลดรูปภาพ...",

      success: {
        render() {
          return `อัพโหลด ${selectedFiles.length} รูปสำเร็จ`;
        },
      },

      error: {
        render({ data }: any) {
          log.error(data);
          const msg =
            data?.response?.data?.message ||
            data?.message ||
            "เกิดข้อผิดพลาดในการอัพโหลด";
          return `อัพโหลดไม่สำเร็จ: ${msg} ❌`;
        },
      },
    });

    e.target.value = "";
  };

  const handleRemove = async (id: string) => {
    try {
      await DormService.deleteImage(id);
      toast.success("ลบรูปสำเร็จ");
      await fetchImages();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const newOrder = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
      ...img,
      order: idx,
      isCover: idx === 0,
    }));

    setImages(newOrder);

    try {
      await DormService.updateImageOrder(
        dormId,
        newOrder.map((img) => ({
          id: img.id,
          order: img.order!,
          isCover: img.isCover,
        })),
      );

      await fetchImages();
    } catch (error: any) {
      log.error(error);
      showBackendError(error);
    }
  };

  return (
    <div className="relative space-y-4 p-4">
      <div className="flex items-center justify-between">
        <label className="text-foreground text-xs font-bold">
          รูปภาพ ({images.length}/5){" "}
          <span className="text-xs text-red-500">* ขนาดไม่เกิน 5MB/รูป</span>
        </label>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${images.length >= 5 ? "bg-background text-muted cursor-not-allowed" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
        >
          <ImagePlus size={16} />
          <span>เพิ่มรูปภาพ</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            disabled={images.length >= 5}
            onChange={handleAddImage}
          />
        </label>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img, index) => (
              <SortableImage
                key={img.id}
                id={img.id}
                img={img}
                index={index}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableImage({
  id,
  img,
  index,
  onRemove,
}: {
  id: string;
  img: DormitoryImage;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const isCover = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-surface relative aspect-square overflow-hidden rounded-xl border-2 shadow-sm transition-colors ${isCover ? "border-blue-500 ring-2 ring-blue-100" : "border-border hover:border-blue-300"}`}
    >
      <img
        src={img.url}
        alt={`Image ${index + 1}`}
        className="pointer-events-none h-full w-full object-cover select-none"
      />
      <div
        className={`absolute top-1 left-1 z-10 rounded-full px-2 py-1 text-xs font-bold ${isCover ? "flex items-center gap-1 bg-blue-600 text-white" : "bg-muted text-white"}`}
      >
        {isCover ? (
          <>
            <Star size={10} fill="currentColor" />
            รูปปก
          </>
        ) : (
          index + 1
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="border-border bg-surface absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border text-red-500 shadow-md transition-all hover:cursor-pointer active:scale-90"
      >
        <X size={14} />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-move"
      />
    </div>
  );
}
