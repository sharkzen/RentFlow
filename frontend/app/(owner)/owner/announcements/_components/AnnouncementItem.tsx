import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Pin, PinOff, Eye, Edit2, Trash2 } from "lucide-react";

interface AnnouncementItemProps {
  item: any;
  index: number;
  onTogglePin: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AnnouncementItem({
  item,
  index,
  onTogglePin,
  onPreview,
  onEdit,
  onDelete,
}: AnnouncementItemProps) {
  return (
    <Draggable draggableId={item.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group flex items-center justify-between rounded-xl border p-4 transition-all ${snapshot.isDragging ? "border-blue-400 bg-blue-50 shadow-lg" : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              {...provided.dragHandleProps}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
              title="ลากเพื่อจัดเรียง"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate font-medium text-slate-800">
                {item.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePin}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${item.isPinned ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
              title={item.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
            >
              {item.isPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </button>
            <div className="mx-1 h-4 w-px bg-slate-200"></div>
            <button
              onClick={onPreview}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
              title="ดูตัวอย่าง"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
              title="แก้ไข"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
