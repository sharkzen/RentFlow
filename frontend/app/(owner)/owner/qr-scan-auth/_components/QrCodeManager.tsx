"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { RoomService } from "@/features/room/services/room.service";
import { QrScanAuthService } from "@/features/qr-scan-auth/services/qr-scan-auth.services";
import { QrCodeFilters } from "./QrCodeFilters";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog, {
  ConfirmDialogType,
} from "@/components/ui/ConfirmDialog";
import { Dormitory } from "@/features/dormitory";

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";

  return (
    new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString)) + " น."
  );
};

const downloadPdf = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function QrCodeManager() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string>("all");
  const [rooms, setRooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    type: "warning" as ConfirmDialogType,
    onConfirm: () => {},
  });

  const closeConfirm = () =>
    setConfirmDialog((prev) => ({
      ...prev,
      isOpen: false,
    }));

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const data = await DormService.getDorm();
        setDorms(data);

        if (data.length > 0) setSelectedDormId(data[0].id);
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลหอพักได้");
      }
    };

    fetchDorms();
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!selectedDormId || selectedDormId === "all") return;

    setIsLoading(true);

    try {
      const data = await RoomService.getRooms(selectedDormId, "ALL");
      setRooms(data);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDormId]);

  useEffect(() => {
    fetchRooms();
    setSelectedRooms([]);
  }, [fetchRooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch = r.roomNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isActive = r.roomQrAuth !== null ? r.roomQrAuth.isActive : false;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? isActive
            : !isActive;
      return matchSearch && matchStatus;
    });
  }, [rooms, searchTerm, statusFilter]);

  const creatableRooms = useMemo(
    () => filteredRooms.filter((r) => r.status !== "AVAILABLE"),
    [filteredRooms],
  );
  const creatableRoomIds = useMemo(
    () => creatableRooms.map((r) => r.id),
    [creatableRooms],
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRooms(e.target.checked ? creatableRoomIds : []);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const handleToggleQrStatus = async (
    roomId: string,
    currentStatus: boolean,
  ) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,

              roomQrAuth: {
                ...r.roomQrAuth,
                isActive: !currentStatus,
              },
            }
          : r,
      ),
    );

    try {
      await QrScanAuthService.toggleStatus(roomId, !currentStatus);
      toast.success(`อัปเดตสิทธิ์การใช้งาน QR Code สำเร็จ`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสิทธิ์");
      fetchRooms();
    }
  };

  const executeCreateOrRenew = async (roomId: string, roomNumber: string) => {
    const toastId = toast.loading("กำลังสร้าง QR Code...");

    try {
      const blob = await QrScanAuthService.createOrRenewQr(roomId);
      downloadPdf(blob, `QR_Room_${roomNumber}.pdf`);

      toast.update(toastId, {
        render: `สร้าง QR Code ห้อง ${roomNumber} สำเร็จ`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      fetchRooms();
    } catch (error) {
      toast.update(toastId, {
        render: "เกิดข้อผิดพลาด ไม่สามารถสร้าง QR Code ได้",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleCreateOrRenewQr = (
    roomId: string,
    isGenerated: boolean,
    roomNumber: string,
  ) => {
    if (isGenerated) {
      setConfirmDialog({
        isOpen: true,
        title: "ยืนยันการสร้าง QR Code ใหม่?",
        description: `การสร้างใหม่จะทำให้ QR Code เดิมของห้อง ${roomNumber} ใช้งานไม่ได้ทันที ต้องการดำเนินการต่อหรือไม่?`,
        type: "warning",

        onConfirm: () => {
          closeConfirm();
          executeCreateOrRenew(roomId, roomNumber);
        },
      });
    } else {
      executeCreateOrRenew(roomId, roomNumber);
    }
  };

  const executeBulkCreate = async () => {
    setIsBulkLoading(true);
    const toastId = toast.loading("กำลังสร้าง QR Code แบบกลุ่ม (PDF)...");

    try {
      const blob = await QrScanAuthService.generateBulkPdf(selectedRooms);
      downloadPdf(blob, `QRCodes_Bulk.pdf`);

      toast.update(toastId, {
        render: "สร้างไฟล์ PDF แบบกลุ่มสำเร็จ",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setSelectedRooms([]);
      fetchRooms();
    } catch (error) {
      toast.update(toastId, {
        render: "เกิดข้อผิดพลาด ไม่สามารถสร้างไฟล์ PDF ได้",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkCreate = () => {
    if (selectedRooms.length === 0) return;

    const roomsWithExistingQr = filteredRooms.filter(
      (r) => selectedRooms.includes(r.id) && r.roomQrAuth !== null,
    );

    if (roomsWithExistingQr.length > 0) {
      const roomNumbers = roomsWithExistingQr
        .map((r) => r.roomNumber)
        .join(", ");

      setConfirmDialog({
        isOpen: true,
        title: "สร้าง QR Code แบบกลุ่มใหม่",
        description: `ในรายการที่เลือกมีห้องที่สร้าง QR Code ไว้แล้ว (${roomNumbers}) การสร้างใหม่จะทำให้ QR Code เดิมของห้องเหล่านี้ใช้งานไม่ได้ทันที ต้องการดำเนินการต่อหรือไม่?`,
        type: "warning",

        onConfirm: () => {
          closeConfirm();
          executeBulkCreate();
        },
      });
    } else {
      executeBulkCreate();
    }
  };

  return (
    <div className="my-5 w-full rounded-xl border border-gray-200">
      <QrCodeFilters
        dorms={dorms}
        selectedDormId={selectedDormId}
        setSelectedDormId={setSelectedDormId}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCount={selectedRooms.length}
        onBulkCreate={handleBulkCreate}
        isBulkLoading={isBulkLoading}
      />
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
              <th className="w-12 px-4 py-4 text-center font-medium sm:px-6">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={handleSelectAll}
                  checked={
                    creatableRoomIds.length > 0 &&
                    creatableRoomIds.every((id) => selectedRooms.includes(id))
                  }
                  disabled={creatableRoomIds.length === 0}
                  title="เลือกทั้งหมด (เฉพาะห้องที่มีผู้เช่า)"
                />
              </th>
              <th className="px-4 py-4 font-medium sm:px-6">ห้อง</th>
              <th className="px-4 py-4 font-medium sm:px-6">
                สิทธิ์เข้าด้วย QR
              </th>
              <th className="px-4 py-4 font-medium sm:px-6">สถานะห้อง</th>
              <th className="px-4 py-4 font-medium sm:px-6">
                วันที่สร้าง(ล่าสุด)
              </th>
              <th className="px-4 py-4 text-right font-medium sm:px-6">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  ไม่พบข้อมูลห้องพัก
                </td>
              </tr>
            ) : (
              filteredRooms.map((room) => (
                <RoomTableRow
                  key={room.id}
                  room={room}
                  isSelected={selectedRooms.includes(room.id)}
                  onSelect={() => handleSelectRoom(room.id)}
                  onToggleStatus={handleToggleQrStatus}
                  onCreateOrRenew={handleCreateOrRenewQr}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
      />
    </div>
  );
}

const TableSkeleton = () => (
  <>
    {Array.from({
      length: 5,
    }).map((_, idx) => (
      <tr key={idx} className="bg-white">
        <td className="px-4 py-4 text-center sm:px-6">
          <Skeleton className="mx-auto h-4 w-4 rounded" />
        </td>
        <td className="px-4 py-4 sm:px-6">
          <Skeleton className="h-6 w-16" rounded="md" />
        </td>
        <td className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-9" rounded="full" />
            <Skeleton className="h-4 w-20" rounded="sm" />
          </div>
        </td>
        <td className="px-4 py-4 sm:px-6">
          <Skeleton className="h-6 w-14" rounded="md" />
        </td>
        <td className="px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-28" rounded="sm" />
        </td>
        <td className="px-4 py-4 sm:px-6">
          <div className="flex justify-end">
            <Skeleton className="h-8 w-28" rounded="md" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

const RoomTableRow = ({
  room,
  isSelected,
  onSelect,
  onToggleStatus,
  onCreateOrRenew,
}: any) => {
  const isQrGenerated = room.roomQrAuth !== null;
  const isQrActive = isQrGenerated ? room.roomQrAuth.isActive : false;
  const isVacant = room.status === "AVAILABLE";
  const createdDateStr = isQrGenerated
    ? room.roomQrAuth.updatedAt || room.roomQrAuth.createdAt
    : null;

  return (
    <tr className="transition-colors hover:bg-gray-50/50">
      <td className="px-4 py-4 text-center sm:px-6">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          checked={isSelected}
          onChange={onSelect}
          disabled={isVacant}
          title={isVacant ? "ต้องมีผู้เช่าก่อนถึงจะทำรายการได้" : ""}
        />
      </td>
      <td className="px-4 py-4 sm:px-6">
        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {room.roomNumber}
        </span>
      </td>
      <td className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleStatus(room.id, isQrActive)}
            disabled={!isQrGenerated}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed ${!isQrGenerated ? "bg-gray-100" : isQrActive ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isQrActive ? "translate-x-4" : "translate-x-1"}`}
            />
          </button>
          <span
            className={`text-sm ${!isQrGenerated ? "text-gray-400" : isQrActive ? "text-gray-900" : "text-gray-500"}`}
          >
            {!isQrGenerated
              ? "ยังไม่สร้าง QR"
              : isQrActive
                ? "อนุญาต"
                : "ระงับ"}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-6">
        {isVacant ? (
          <span className="rounded-md border border-green-100 bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
            ว่าง
          </span>
        ) : (
          <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
            มีผู้เช่า
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-gray-600 sm:px-6">
        {createdDateStr ? formatDateTime(createdDateStr) : "-"}
      </td>
      <td className="px-4 py-4 text-right sm:px-6">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() =>
              onCreateOrRenew(room.id, isQrGenerated, room.roomNumber)
            }
            disabled={isVacant && !isQrGenerated}
            title={
              isVacant && !isQrGenerated ? "ต้องมีผู้เช่าก่อนถึงจะสร้างได้" : ""
            }
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${isVacant && !isQrGenerated ? "bg-gray-50 text-gray-300" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            {isQrGenerated ? (
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Plus className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {isQrGenerated ? "รีเซ็ต (สร้างใหม่)" : "สร้าง QR Code"}
            </span>
            <span className="inline sm:hidden">
              {isQrGenerated ? "รีเซ็ต" : "สร้าง"}
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
};
