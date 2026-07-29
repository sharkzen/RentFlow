"use client";
import React from "react";
import { Building2, GripVertical, Star, X } from "lucide-react";

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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dormitory } from "@/features/admin/types";

interface FeaturedOrderListProps {
  items: Dormitory[];
  onReorder: (items: Dormitory[]) => void;
  onRemove: (dorm: Dormitory) => void;
}

export function FeaturedOrderList({
  items,
  onReorder,
  onRemove,
}: FeaturedOrderListProps) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  if (items.length === 0) {
    return (
      <div className="border-muted bg-background text-muted rounded-xl border border-dashed p-8 text-center text-sm">
        ยังไม่มีหอพักที่ถูกปักหมุดแนะนำ กดปุ่ม "ปักหมุดแนะนำ"
        ในตารางด้านล่างเพื่อเริ่มต้น
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableFeaturedItem
              key={item.id}
              item={item}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableFeaturedItem({
  item,
  index,
  onRemove,
}: {
  item: Dormitory;
  index: number;
  onRemove: (dorm: Dormitory) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const coverImage =
    item.images?.find((img) => img.isCover) || item.images?.[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-surface flex items-center gap-3 rounded-xl border p-3 shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="text-muted hover:text-foreground cursor-move touch-none"
      >
        <GripVertical size={18} />
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
        {index + 1}
      </div>
      <div className="border-border bg-background h-10 w-14 shrink-0 overflow-hidden rounded-lg border">
        {coverImage ? (
          <img
            src={
              coverImage.objectKey.startsWith("http")
                ? coverImage.objectKey
                : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${coverImage.objectKey}`
            }
            className="h-full w-full object-cover"
            alt=""
          />
        ) : (
          <div className="text-muted flex h-full items-center justify-center">
            <Building2 size={14} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground line-clamp-1 text-sm font-semibold">
          {item.name}
        </p>
        <p className="text-muted line-clamp-1 flex items-center gap-1 text-xs">
          <Star size={10} fill="currentColor" className="text-amber-500" />
          หอพักแนะนำ
        </p>
      </div>
      <button
        onClick={() => onRemove(item)}
        className="text-muted cursor-pointer rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-500"
        title="เลิกแนะนำ"
      >
        <X size={16} />
      </button>
    </div>
  );
}
