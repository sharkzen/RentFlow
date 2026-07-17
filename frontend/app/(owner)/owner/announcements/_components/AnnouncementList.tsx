"use client";
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import AnnouncementItem from "./AnnouncementItem";
import AnnouncementPreviewModal from "./AnnouncementPreviewModal";
import AnnouncementEditModal from "./AnnouncementEditModal";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { AnnouncementService } from "@/features/announcement/services/announcement.service";
import { toast } from "react-toastify";

interface AnnouncementListProps {
  data: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AnnouncementList({
  data,
  isLoading,
  onRefresh,
}: AnnouncementListProps) {
  const [pinnedItems, setPinnedItems] = useState<any[]>([]);
  const [normalItems, setNormalItems] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (data) {
      const sortedData = [...data].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      setPinnedItems(sortedData.filter((item) => item.isPinned));
      setNormalItems(sortedData.filter((item) => !item.isPinned));
    }
  }, [data]);

  const handleDragEnd = async (result: any) => {
    const { source, destination } = result;

    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    if (source.droppableId !== destination.droppableId) {
      toast.warning("กรุณาใช้ปุ่ม 📌 เพื่อย้ายกลุ่มประกาศ");
      return;
    }

    const isPinnedList = source.droppableId === "pinned-list";
    const listToUpdate = isPinnedList
      ? Array.from(pinnedItems)
      : Array.from(normalItems);
    const [reorderedItem] = listToUpdate.splice(source.index, 1);
    listToUpdate.splice(destination.index, 0, reorderedItem);

    if (isPinnedList) {
      setPinnedItems(listToUpdate);
    } else {
      setNormalItems(listToUpdate);
    }

    const itemsToUpdate = listToUpdate.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    try {
      await AnnouncementService.reorderAnnouncements(itemsToUpdate);
    } catch (error) {
      console.error("Reorder failed:", error);
      toast.error("จัดเรียงไม่สำเร็จ กรุณาลองใหม่");
      onRefresh();
    }
  };

  const handleTogglePin = async (id: string, isCurrentlyPinned: boolean) => {
    let movedItem: any = null;

    if (isCurrentlyPinned) {
      const itemIndex = pinnedItems.findIndex((i) => i.id === id);

      if (itemIndex > -1) {
        movedItem = {
          ...pinnedItems[itemIndex],
          isPinned: false,
        };

        const newPinned = [...pinnedItems];
        newPinned.splice(itemIndex, 1);
        setPinnedItems(newPinned);
        setNormalItems([movedItem, ...normalItems]);
      }
    } else {
      const itemIndex = normalItems.findIndex((i) => i.id === id);

      if (itemIndex > -1) {
        movedItem = {
          ...normalItems[itemIndex],
          isPinned: true,
        };

        const newNormal = [...normalItems];
        newNormal.splice(itemIndex, 1);
        setNormalItems(newNormal);
        setPinnedItems([movedItem, ...pinnedItems]);
      }
    }

    try {
      await AnnouncementService.togglePinAnnouncement(id);
    } catch (error) {
      console.error("Toggle pin failed:", error);
      toast.error("เปลี่ยนสถานะไม่สำเร็จ");
      onRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await AnnouncementService.deleteAnnouncement(itemToDelete.id);
      toast.success("ลบประกาศเรียบร้อยแล้ว");
      onRefresh();
      setItemToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบประกาศได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 w-full animate-pulse rounded-xl bg-slate-100"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-8">
          {pinnedItems.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
                📌 ประกาศปักหมุด
              </h3>
              <Droppable droppableId="pinned-list" type="PINNED">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[50px] space-y-3"
                  >
                    {pinnedItems.map((item, index) => (
                      <AnnouncementItem
                        key={item.id}
                        item={item}
                        index={index}
                        onTogglePin={() => handleTogglePin(item.id, true)}
                        onPreview={() => setPreviewItem(item)}
                        onEdit={() => setEditItem(item)}
                        onDelete={() => setItemToDelete(item)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
          {normalItems.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
                📄 ประกาศ
              </h3>
              <Droppable droppableId="normal-list" type="NORMAL">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[50px] space-y-3"
                  >
                    {normalItems.map((item, index) => (
                      <AnnouncementItem
                        key={item.id}
                        item={item}
                        index={index}
                        onTogglePin={() => handleTogglePin(item.id, false)}
                        onPreview={() => setPreviewItem(item)}
                        onEdit={() => setEditItem(item)}
                        onDelete={() => setItemToDelete(item)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </div>
      </DragDropContext>
      {previewItem && (
        <AnnouncementPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
      <AnnouncementEditModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={onRefresh}
      />
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        type="error"
        title="ยืนยันการลบประกาศ"
        description={`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${itemToDelete?.title || ""}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        cancelText="ยกเลิก"
      />
    </>
  );
}
