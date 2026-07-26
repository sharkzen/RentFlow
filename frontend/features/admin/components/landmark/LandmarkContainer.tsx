"use client";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AdminService } from "@/features/admin/services/admin.service";
import { Landmark, CreateLandmarkPayload } from "@/features/admin/types";
import { ApiError } from "@/types";
import { LandmarkHeader } from "./LandmarkHeader";
import { LandmarkTable } from "./LandmarkTable";
import { LandmarkModal } from "./LandmarkModal";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import { Search } from "lucide-react";

export default function LandmarkContainer() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingLandmark, setEditingLandmark] = useState<Landmark | null>(null);

  const [meta, setMeta] = useState({
    totalPages: 1,
  });

  const [deleteData, setDeleteData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const isMountedRef = useRef(true);

  const handleOpenCreateModal = () => {
    setEditingLandmark(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (landmark: Landmark) => {
    setEditingLandmark(landmark);
    setIsModalOpen(true);
  };

  const fetchLandmarks = async () => {
    setIsLoading(true);

    try {
      const res = await AdminService.getLandmarks(page, 10, search);
      if (isMountedRef.current) {
        setLandmarks(res.data);

        setMeta({
          totalPages: res.meta.totalPages,
        });
      }
    } catch (error) {
      console.error(error);
      if (isMountedRef.current)
        toast.error("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => fetchLandmarks(), 500);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [page, search]);

  const handleCreate = async (payload: CreateLandmarkPayload) => {
    setIsModalOpen(false);
    const promise = AdminService.createLandmark(payload);

    try {
      await toast.promise(promise, {
        pending: "กำลังตรวจสอบลิงก์และบันทึกข้อมูล...",

        success: {
          render() {
            return `เพิ่ม "${payload.name}" เรียบร้อยแล้ว`;
          },
        },

        error: {
          render({ data }: any) {
            const err = data as ApiError;
            let msg = err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ";

            if (msg.includes("Invalid")) {
              msg = "ลิงก์แผนที่ไม่ถูกต้อง หรือไม่สามารถดึงพิกัดได้";
            }

            return msg;
          },
        },
      });

      fetchLandmarks();
    } catch (error) {
      setIsModalOpen(true);
    }
  };

  const handleDeleteClick = (landmark: Landmark) => {
    setDeleteData({
      id: landmark.id,
      name: landmark.name,
    });
  };

  const handleSave = async (payload: CreateLandmarkPayload) => {
    setIsModalOpen(false);
    const isEditing = !!editingLandmark;
    const promise = isEditing
      ? AdminService.updateLandmark(editingLandmark.id, payload)
      : AdminService.createLandmark(payload);

    try {
      await toast.promise(promise, {
        pending: "กำลังตรวจสอบลิงก์และบันทึกข้อมูล...",

        success: {
          render() {
            return isEditing
              ? `แก้ไข "${payload.name}" เรียบร้อยแล้ว`
              : `เพิ่ม "${payload.name}" เรียบร้อยแล้ว`;
          },
        },

        error: {
          render({ data }: any) {
            const err = data as ApiError;
            let msg = err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ";

            if (msg.includes("Invalid")) {
              msg = "ลิงก์แผนที่ไม่ถูกต้อง หรือไม่สามารถดึงพิกัดได้";
            }

            return msg;
          },
        },
      });

      fetchLandmarks();
      setEditingLandmark(null);
    } catch (error) {
      setIsModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteData) return;

    setIsDeleting(true);

    try {
      await AdminService.deleteLandmark(deleteData.id);
      toast.success("ลบข้อมูลเรียบร้อยแล้ว");
      fetchLandmarks();
      setDeleteData(null);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบข้อมูลได้");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="">
        <LandmarkHeader onOpenModal={handleOpenCreateModal} />
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานที่..."
              className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <LandmarkTable
          data={landmarks}
          isLoading={isLoading}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
        <LandmarkModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLandmark(null);
          }}
          onSubmit={handleSave}
          initialData={editingLandmark}
        />
        <ConfirmDialog
          isOpen={!!deleteData}
          onClose={() => !isDeleting && setDeleteData(null)}
          onConfirm={handleConfirmDelete}
          title="ยืนยันการลบข้อมูล"
          description={`คุณแน่ใจหรือไม่ที่จะลบ "${deleteData?.name}"? การกระทำนี้ไม่สามารถเรียกคืนได้`}
          type="error"
          confirmText="ลบข้อมูล"
          cancelText="ยกเลิก"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
