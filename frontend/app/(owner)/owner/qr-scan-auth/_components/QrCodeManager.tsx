"use client";

import React, { useState, useEffect } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { RoomService } from "@/features/room/services/room.service";
import { QrScanAuthService } from "@/features/qr-scan-auth/services/qr-scan-auth.services";
import { QrCodeFilters } from "./QrCodeFilters";
import Pagination from "@/components/ui/Pagination"; // <-- แก้ไข Path ให้ตรงกับที่เก็บไฟล์ของคุณ
import { Plus, RefreshCw } from "lucide-react";

export default function QrCodeManager() {
  const [dorms, setDorms] = useState<any[]>([]);
  const [selectedDormId, setSelectedDormId] = useState<string>("all");
  const [rooms, setRooms] = useState<any[]>([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination & Selection State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // 1. Fetch หอพัก
  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const data = await DormService.getDorm();
        setDorms(data);
        if (data.length > 0) setSelectedDormId(data[0].id);
      } catch (error) {
        console.error("Error fetching dorms:", error);
      }
    };
    fetchDorms();
  }, []);

  // 2. Fetch ห้อง
  const fetchRooms = async () => {
    if (!selectedDormId || selectedDormId === "all") return;
    setIsLoading(true);
    try {
      const data = await RoomService.getRooms(selectedDormId, "ALL");
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    setCurrentPage(1);
    setSelectedRooms([]);
  }, [selectedDormId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // 3. Logic การกรองข้อมูล
  const filteredRooms = rooms.filter((r) => {
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

  // 4. Logic การแบ่งหน้า (Pagination)
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Helper หาห้องที่อนุญาตให้เลือกทำ Bulk
  const creatableRooms = filteredRooms.filter(
    (r) => r.roomQrAuth === null && r.status !== "AVAILABLE",
  );
  const creatableRoomIds = creatableRooms.map((r) => r.id);

  // 5. Handlers สำหรับ Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRooms(creatableRoomIds);
    else setSelectedRooms([]);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  // Helper ฟังก์ชันสำหรับดาวน์โหลดไฟล์ PDF
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

  // 6. API Handlers
  const handleToggleQrStatus = async (
    roomId: string,
    currentStatus: boolean,
  ) => {
    try {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                roomQrAuth: { ...r.roomQrAuth, isActive: !currentStatus },
              }
            : r,
        ),
      );
      await QrScanAuthService.toggleStatus(roomId, !currentStatus);
    } catch (error) {
      console.error("Toggle error:", error);
      fetchRooms();
    }
  };

  const handleCreateOrRenewQr = async (
    roomId: string,
    isGenerated: boolean,
    roomNumber: string,
  ) => {
    if (
      isGenerated &&
      !confirm(
        "การสร้างใหม่จะทำให้ QR Code เดิมใช้งานไม่ได้ทันที ต้องการดำเนินการต่อหรือไม่?",
      )
    )
      return;

    try {
      const blob = await QrScanAuthService.createOrRenewQr(roomId);
      downloadPdf(blob, `QR_Room_${roomNumber}.pdf`);
      fetchRooms();
    } catch (error) {
      console.error("Generate error:", error);
      alert("เกิดข้อผิดพลาด ไม่สามารถสร้าง QR Code ได้");
    }
  };

  const handleBulkCreate = async () => {
    if (selectedRooms.length === 0) return;
    setIsBulkLoading(true);
    try {
      const blob = await QrScanAuthService.generateBulkPdf(selectedRooms);
      downloadPdf(blob, `QRCodes_Bulk.pdf`);
      setSelectedRooms([]);
      fetchRooms();
    } catch (error) {
      console.error("Bulk generate error:", error);
      alert("เกิดข้อผิดพลาด ไม่สามารถสร้างไฟล์ PDF ได้");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="my-5 w-full rounded-xl border border-gray-200 bg-white shadow-sm">
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
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={handleSelectAll}
                  checked={
                    creatableRoomIds.length > 0 &&
                    creatableRoomIds.every((id) => selectedRooms.includes(id))
                  }
                  disabled={creatableRoomIds.length === 0}
                  title="เลือกทั้งหมดเฉพาะห้องที่ยังไม่ได้สร้างและมีผู้เช่า"
                />
              </th>
              <th className="px-4 py-4 font-medium sm:px-6">ห้อง</th>
              <th className="px-4 py-4 font-medium sm:px-6">
                สิทธิ์เข้าด้วย QR
              </th>
              <th className="px-4 py-4 font-medium sm:px-6">สถานะห้อง</th>
              <th className="px-4 py-4 text-right font-medium sm:px-6">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : paginatedRooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  ไม่พบข้อมูลห้องพัก
                </td>
              </tr>
            ) : (
              paginatedRooms.map((room) => {
                const isQrGenerated = room.roomQrAuth !== null;
                const isQrActive = isQrGenerated
                  ? room.roomQrAuth.isActive
                  : false;
                const isVacant = room.status === "AVAILABLE";

                return (
                  <tr
                    key={room.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-4 text-center sm:px-6">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                        checked={selectedRooms.includes(room.id)}
                        onChange={() => handleSelectRoom(room.id)}
                        disabled={isVacant}
                        title={
                          isVacant ? "ต้องมีผู้เช่าก่อนถึงจะทำรายการได้" : ""
                        }
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
                          onClick={() =>
                            handleToggleQrStatus(room.id, isQrActive)
                          }
                          disabled={!isQrGenerated}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                            !isQrGenerated
                              ? "cursor-not-allowed bg-gray-100"
                              : isQrActive
                                ? "bg-green-500"
                                : "bg-gray-300"
                          }`}
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

                    <td className="px-4 py-4 text-right sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleCreateOrRenewQr(
                              room.id,
                              isQrGenerated,
                              room.roomNumber,
                            )
                          }
                          disabled={isVacant && !isQrGenerated}
                          title={
                            isVacant && !isQrGenerated
                              ? "ต้องมีผู้เช่าก่อนถึงจะสร้างได้"
                              : ""
                          }
                          className={`flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium transition-colors ${
                            isVacant && !isQrGenerated
                              ? "cursor-not-allowed bg-gray-50 text-gray-300"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {isQrGenerated ? (
                            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="hidden sm:inline">
                            {isQrGenerated
                              ? "รีเซ็ต (สร้างใหม่)"
                              : "สร้าง QR Code"}
                          </span>
                          <span className="inline sm:hidden">
                            {isQrGenerated ? "รีเซ็ต" : "สร้าง"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ใช้งาน Pagination เดิมของคุณ */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page: number) => setCurrentPage(page)}
      />
    </div>
  );
}
