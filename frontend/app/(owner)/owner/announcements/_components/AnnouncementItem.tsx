import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Pin, PinOff, Eye, Edit2, Trash2 } from "lucide-react";
import { formatThaiDate } from "@/lib/dateFormatter";

interface AnnouncementItemProps {
  item: any;
  index: number;
  onTogglePin: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CONTENT_PREVIEW_LENGTH = 90;

export default function AnnouncementItem({
  item,
  index,
  onTogglePin,
  onPreview,
  onEdit,
  onDelete,
}: AnnouncementItemProps) {
  const content: string = item.content || "";
  const contentPreview =
    content.length > CONTENT_PREVIEW_LENGTH
      ? content.slice(0, CONTENT_PREVIEW_LENGTH).trimEnd() + "…"
      : content;
  const dateLabel =
    formatThaiDate(item.updatedAt || item.createdAt, "short-datetime") || "";

  return (
    <Draggable draggableId={item.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group flex items-center justify-between gap-3 rounded-xl border p-4 transition-all ${snapshot.isDragging ? "dark:bg-background border-blue-400 bg-blue-50 shadow-lg" : "border-border bg-surface hover:border-muted shadow-sm hover:shadow-md"}`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              {...provided.dragHandleProps}
              className="text-muted hover:bg-background hover:text-foreground flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
              title="ลากเพื่อจัดเรียง"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                {item.isPinned && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Pin className="h-3 w-3" />
                    ปักหมุด
                  </span>
                )}
                <span className="text-foreground truncate font-semibold">
                  {item.title}
                </span>
              </div>
              {contentPreview && (
                <span className="text-muted line-clamp-1 truncate text-sm">
                  {contentPreview}
                </span>
              )}
              {dateLabel && (
                <span className="text-muted text-xs">
                  ประกาศเมื่อ {dateLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onTogglePin}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${item.isPinned ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "text-muted hover:bg-background hover:text-foreground"}`}
              title={item.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
            >
              {item.isPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </button>
            <div className="bg-border mx-1 h-4 w-px"></div>
            <button
              onClick={onPreview}
              className="text-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-600"
              title="ดูตัวอย่าง"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="text-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-amber-50 hover:text-amber-600"
              title="แก้ไข"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-600"
              title="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
