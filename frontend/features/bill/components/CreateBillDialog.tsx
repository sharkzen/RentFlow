"use client";
import { useState, useEffect } from "react";

import {
  X,
  Plus,
  Save,
  Calendar,
  FileText,
  FolderOpen,
  Trash2,
  Clock,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

import log from "@/lib/logger";
import { toast } from "react-toastify";
import { RoomService } from "@/features/room/services/room.service";
import BillItemRow from "./BillItemRow";
import MonthYearPicker from "@/lib/ui/MonthYearPicker";
import ConfirmDialog from "@/lib/ui/ConfirmDialog";
import MeterScannerModal from "./MeterScannerModal";
import { BillService } from "@/features/bill/services/bill.service";
import { v4 as uuidv4 } from "uuid";

interface Draft {
  id: string;
  name: string;
  updatedAt: string;
  items: BillItem[];
  selectedDate: string;
}

interface RoomData {
  id: string;
  roomNumber: string;
  tenantName: string | null;
  lastWaterUnit: number;
  lastElectricUnit: number;
  hasLastBill: boolean;
  commonFee: number;
  waterMeterDigits?: number | null;
  electricMeterDigits?: number | null;
}

interface BillItem {
  id: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  prevWater: number;
  currentWater: string | "";
  waterImage?: string;
  waterImageKey?: string;
  prevElectric: number;
  currentElectric: string | "";
  electricImage?: string;
  electricImageKey?: string;
  isPrevEditable: boolean;
  commonFee: number;
  waterMeterDigits?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  selectedDormId: string;
  dormName: string;
  dueDay?: number;
  dueMonthOffset?: number;
  lateFee?: number;
  isWaterFlatRate?: boolean;
  ocrFeatureEnabled: boolean;
}

export default function CreateBillDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedDormId,
  dormName,
  dueDay,
  dueMonthOffset,
  lateFee,
  isWaterFlatRate = false,
  ocrFeatureEnabled,
}: Props) {
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFullImage, setPreviewFullImage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOverdueConfirm, setShowOverdueConfirm] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDraftList, setShowDraftList] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftNameInput, setDraftNameInput] = useState("");

  const [scanConfig, setScanConfig] = useState<{
    isOpen: boolean;
    type: "WATER" | "ELECTRIC";
    index: number;
  }>({
    isOpen: false,
    type: "WATER",
    index: 0,
  });

  const handleStartScan = (type: "WATER" | "ELECTRIC") => {
    if (items.length <= 1 && !items[0].roomId && availableRooms.length > 0) {
      const newItems = availableRooms.map((room) => ({
        ...createEmptyItem(),
        roomId: room.id,
        roomNumber: room.roomNumber,
        tenantName: room.tenantName || "-",
        isPrevEditable: !room.hasLastBill,
        prevWater: room.lastWaterUnit,
        prevElectric: room.lastElectricUnit,
        commonFee: room.commonFee || 0,
        waterMeterDigits: room.waterMeterDigits ?? null,
      }));

      setItems(newItems);
    }

    setScanConfig({
      isOpen: true,
      type,
      index: 0,
    });
  };

  const handleScanConfirm = async (
    ocrValue: string,
    uploadResult: {
      url: string;
      objectKey: string;
    },
  ) => {
    const { index, type } = scanConfig;

    setItems((prev) => {
      const newItems = [...prev];

      if (type === "WATER") {
        newItems[index].currentWater = ocrValue;
        newItems[index].waterImage = uploadResult.url;
        newItems[index].waterImageKey = uploadResult.objectKey;
      } else {
        newItems[index].currentElectric = ocrValue;
        newItems[index].electricImage = uploadResult.url;
        newItems[index].electricImageKey = uploadResult.objectKey;
      }

      return newItems;
    });

    handleScanNext();
  };

  const handleScanNext = () => {
    if (scanConfig.index < items.length - 1) {
      setScanConfig((prev) => ({
        ...prev,
        isOpen: true,
        index: prev.index + 1,
      }));
    } else {
      toast.success("สแกนครบทุกห้องเรียบร้อยแล้ว");

      setScanConfig({
        isOpen: false,
        type: "WATER",
        index: 0,
      });
    }
  };

  const createEmptyItem = (): BillItem => ({
    id: uuidv4(),
    roomId: "",
    roomNumber: "",
    tenantName: "",
    prevWater: 0,
    currentWater: "",
    prevElectric: 0,
    currentElectric: "",
    isPrevEditable: false,
    commonFee: 0,
  });

  const [items, setItems] = useState<BillItem[]>([createEmptyItem()]);

  const hasNegativeUsage = items.some(
    (item) =>
      (!isWaterFlatRate &&
        item.currentWater !== "" &&
        Number(item.currentWater) < item.prevWater) ||
      (item.currentElectric !== "" &&
        Number(item.currentElectric) < item.prevElectric),
  );

  useEffect(() => {
    if (isOpen && selectedDormId) {
      fetchRooms();
      loadDrafts();
    }
  }, [isOpen, selectedDormId]);

  const loadDrafts = async () => {
    try {
      const savedDrafts = await BillService.getDrafts(selectedDormId);
      setDrafts(savedDrafts);
    } catch (error) {
      log.error("Failed to load drafts:", error);
    }
  };

  const handleClearAllRequest = () => {
    const hasData = items.some(
      (i) => i.roomId || i.currentWater !== "" || i.currentElectric !== "",
    );

    if (!hasData) {
      setItems([createEmptyItem()]);
      return;
    }

    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    setItems([createEmptyItem()]);
    setShowClearConfirm(false);
    toast.info("ล้างข้อมูลเรียบร้อยแล้ว");
  };

  const handleSaveDraft = () => {
    if (items.every((i) => !i.roomId)) {
      toast.error("กรุณากรอกข้อมูลก่อนบันทึกฉบับร่าง");
      return;
    }

    setIsSavingDraft(true);
  };

  const confirmSaveDraft = async () => {
    setIsSavingDraft(true);
    const name =
      draftNameInput.trim() || `ร่างวันที่ ${new Date().toLocaleDateString()}`;

    try {
      const newDraft = await BillService.saveDraft({
        dormId: selectedDormId,
        name,
        selectedDate: selectedDate.toISOString(),
        items: items,
      });

      setDrafts([newDraft, ...drafts]);
      setDraftNameInput("");
      setShowDraftList(false);
      toast.success("บันทึกฉบับร่างพร้อมรูปภาพเรียบร้อย");
    } catch (error) {
      log.error("Failed to save draft:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกฉบับร่าง");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const useDraft = (draft: Draft) => {
    setItems(draft.items);
    setSelectedDate(new Date(draft.selectedDate));
    setShowDraftList(false);
    toast.info(`โหลดฉบับร่าง "${draft.name}" แล้ว`);
  };

  const confirmDeleteDraft = async () => {
    if (!draftToDelete) return;

    const id = draftToDelete;

    try {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setDraftToDelete(null);
      await BillService.deleteDraft(id);
    } catch (error) {
      log.error("Failed to delete draft:", error);
      toast.error("ไม่สามารถลบฉบับร่างได้");
      loadDrafts();
    }
  };

  const handleDeleteImage = async (
    index: number,
    type: "WATER" | "ELECTRIC",
  ) => {
    const item = items[index];
    const imageKey =
      type === "WATER" ? item.waterImageKey : item.electricImageKey;

    if (imageKey) {
      try {
        await BillService.deleteTempImage(imageKey);
      } catch (error) {
        log.error("Failed to delete image from R2", error);
        toast.warning("ลบรูปภาพจากหน้าจอแล้ว แต่ไม่สามารถลบไฟล์บนฐานข้อมูลได้");
      }
    }

    const newItems = [...items];

    if (type === "WATER") {
      newItems[index].waterImage = undefined;
      newItems[index].waterImageKey = undefined;
    } else {
      newItems[index].electricImage = undefined;
      newItems[index].electricImageKey = undefined;
    }

    setItems(newItems);
  };

  const handleCaptureImage = (index: number, type: "WATER" | "ELECTRIC") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: any) => {
      const file = e.target.files[0];

      if (file) {
        const localPreviewUrl = URL.createObjectURL(file);

        setItems((prev) => {
          const newItems = [...prev];

          if (type === "WATER") {
            newItems[index].waterImage = localPreviewUrl;
            newItems[index].waterImageKey = undefined;
          } else {
            newItems[index].electricImage = localPreviewUrl;
            newItems[index].electricImageKey = undefined;
          }

          return newItems;
        });

        const currentItem = items[index];
        const oldImageKey =
          type === "WATER"
            ? currentItem.waterImageKey
            : currentItem.electricImageKey;

        if (oldImageKey) {
          BillService.deleteTempImage(oldImageKey).catch((err) =>
            log.error("Failed to clean up old image", err),
          );
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await BillService.uploadTempImage(formData);

          setItems((prev) => {
            const newItems = [...prev];

            if (type === "WATER") {
              newItems[index].waterImage = res.url;
              newItems[index].waterImageKey = res.objectKey;
            } else {
              newItems[index].electricImage = res.url;
              newItems[index].electricImageKey = res.objectKey;
            }

            return newItems;
          });
        } catch (error) {
          log.error("Upload error:", error);
          toast.error("อัปโหลดไม่สำเร็จ รูปภาพถูกยกเลิก กรุณาถ่ายใหม่");

          setItems((prev) => {
            const newItems = [...prev];

            if (type === "WATER") {
              newItems[index].waterImage = undefined;
            } else {
              newItems[index].electricImage = undefined;
            }

            return newItems;
          });
        }
      }
    };

    input.click();
  };

  const fetchRooms = async () => {
    setIsLoadingRooms(true);

    try {
      const res = await RoomService.getRooms(selectedDormId, "OCCUPIED");
      setAvailableRooms(res);
    } catch (error) {
      log.error(error);
      toast.error("ไม่สามารถดึงข้อมูลห้องพักได้");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleRoomSelect = (index: number, roomId: string) => {
    const roomData = availableRooms.find((r) => r.id === roomId);

    if (!roomData) return;

    const isDuplicate = items.some(
      (item, idx) => idx !== index && item.roomId === roomId,
    );

    if (isDuplicate) {
      toast.warning(`ห้อง ${roomData.roomNumber} ถูกเลือกไปแล้ว`);
      return;
    }

    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      roomId: roomData.id,
      roomNumber: roomData.roomNumber,
      tenantName: roomData.tenantName || "-",
      isPrevEditable: !roomData.hasLastBill,
      prevWater: roomData.lastWaterUnit,
      prevElectric: roomData.lastElectricUnit,
      currentWater: "",
      currentElectric: "",
      commonFee: roomData.commonFee || 0,
      waterMeterDigits: roomData.waterMeterDigits ?? null,
    };

    setItems(newItems);
  };

  const handleChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    setItems(newItems);
  };

  const getExpectedDueDate = () => {
    if (!dueDay) return null;

    const dueDate = new Date(
      Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );

    dueDate.setDate(dueDay);
    dueDate.setMonth(dueDate.getMonth() + (dueMonthOffset ?? 0));
    return dueDate;
  };

  const handleSubmit = async () => {
    if (hasNegativeUsage) {
      const errorRooms = items
        .filter(
          (i) =>
            (i.currentWater !== "" && Number(i.currentWater) < i.prevWater) ||
            (i.currentElectric !== "" &&
              Number(i.currentElectric) < i.prevElectric),
        )
        .map((i) => i.roomNumber)
        .join(", ");

      toast.error(
        `บันทึกไม่ได้! พบเลขล่าสุดน้อยกว่าครั้งก่อนที่ห้อง: ${errorRooms}`,
      );
      return;
    }

    const invalidItems = items.filter(
      (i) =>
        !i.roomId ||
        (!isWaterFlatRate && i.currentWater === "") ||
        i.currentElectric === "",
    );

    if (invalidItems.length > 0) {
      toast.error("กรุณาเลือกห้องพัก และกรอกเลขมิเตอร์ให้ครบทุกช่อง");
      return;
    }

    const expectedDueDate = getExpectedDueDate();

    if (expectedDueDate && expectedDueDate < new Date()) {
      setShowOverdueConfirm(true);
      return;
    }

    await proceedSubmit();
  };

  const proceedSubmit = async () => {
    setIsSubmitting(true);

    try {
      await onSubmit({
        billingMonth: selectedDate,

        items: items.map((item) => ({
          roomId: item.roomId,
          prevWater: item.prevWater,
          currentWater: isWaterFlatRate
            ? item.prevWater
            : Number(item.currentWater),
          waterImageKey: item.waterImageKey,
          prevElectric: item.prevElectric,
          currentElectric: Number(item.currentElectric),
          electricImageKey: item.electricImageKey,
          commonFee: item.commonFee || 0,
        })),
      });

      setItems([createEmptyItem()]);
      onClose();
    } catch (err) {
      log.error("Submit Bills Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-0 sm:p-4">
      <div className="relative flex h-full max-h-screen w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl transition-all sm:max-h-[95vh] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">สร้างบิลค่าเช่า</h2>
              <p className="text-xs text-gray-500">{dormName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDraftList(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600"
            >
              <span className="text-blue-500 underline">
                ฉบับร่าง {drafts.length > 0 && `(${drafts.length})`}
              </span>
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-2 text-gray-400 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="relative z-40 flex flex-col items-start justify-between gap-4 border-b border-slate-100 bg-gray-50/50 p-4 lg:flex-row lg:items-center">
          <div className="w-full sm:w-auto">
            <MonthYearPicker
              value={selectedDate}
              onChange={setSelectedDate}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto lg:flex-nowrap">
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={handleClearAllRequest}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition-all hover:bg-red-100 sm:flex-none"
              >
                <RotateCcw size={14} />
                ล้างข้อมูล
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 transition-all hover:bg-amber-100 sm:flex-none"
              >
                <FileText size={16} />
                บันทึกฉบับร่าง
              </button>
            </div>
            {ocrFeatureEnabled ? (
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  onClick={() => handleStartScan("WATER")}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700 transition-all hover:bg-blue-200 sm:flex-none"
                >
                  📷 สแกนน้ำต่อเนื่อง
                </button>
                <button
                  onClick={() => handleStartScan("ELECTRIC")}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 text-xs font-bold text-yellow-700 transition-all hover:bg-yellow-200 sm:flex-none"
                >
                  📷 สแกนไฟต่อเนื่อง
                </button>
              </div>
            ) : (
              <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 sm:w-auto">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>ระบบสแกน OCR ไม่พร้อมใช้งาน</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/30 p-4 pb-20 sm:pb-4">
          {items.map((item, index) => (
            <BillItemRow
              key={item.id}
              item={item}
              index={index}
              availableRooms={availableRooms}
              isLoadingRooms={isLoadingRooms}
              isSubmitting={isSubmitting}
              canRemove={items.length > 1}
              isWaterFlatRate={isWaterFlatRate}
              onRoomSelect={handleRoomSelect}
              onChange={handleChange}
              onRemove={(id) => setItems(items.filter((i) => i.id !== id))}
              onCaptureImage={handleCaptureImage}
              onViewImage={(url) => setPreviewFullImage(url)}
              onDeleteImage={handleDeleteImage}
            />
          ))}
          <button
            onClick={() => setItems([...items, createEmptyItem()])}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 py-4 font-medium text-indigo-600 transition-all hover:bg-indigo-50"
          >
            <Plus size={18} />
            เพิ่มรายการห้อง
          </button>
        </div>
        <div className="absolute right-0 bottom-0 left-0 border-t border-slate-100 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] sm:relative">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">{items.length}รายการ</div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasNegativeUsage}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-8 py-2 font-bold text-white shadow-md transition-all ${isSubmitting || hasNegativeUsage ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"} `}
              >
                <Save size={18} />{" "}
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกและส่งบิล"}
              </button>
            </div>
          </div>
        </div>
        {showDraftList && (
          <div className="animate-in slide-in-from-bottom-5 absolute inset-0 z-40 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <button
                onClick={() => setShowDraftList(false)}
                className="flex cursor-pointer items-center gap-2 font-bold text-indigo-600 hover:text-indigo-700"
              >
                <ArrowLeft size={20} />
                ย้อนกลับ
              </button>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Clock className="text-indigo-600" />
                ฉบับร่างทั้งหมด
              </h3>
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
              {drafts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <p className="text-lg font-medium">ยังไม่มีฉบับร่าง</p>
                </div>
              ) : (
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => useDraft(draft)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-800">
                            {draft.name}
                          </p>
                          <div className="text-[11px] text-gray-400">
                            {new Date(draft.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDraftToDelete(draft.id);
                        }}
                        className="cursor-pointer p-3 text-gray-300 transition-colors hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {isSavingDraft && (
          <div className="animate-in fade-in absolute inset-0 z-50 flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 ring-1 ring-black/5">
              <h3 className="mb-4 text-xl font-bold text-gray-800">
                บันทึกฉบับร่าง
              </h3>
              <input
                autoFocus
                type="text"
                placeholder="ชื่อฉบับร่าง..."
                value={draftNameInput}
                onChange={(e) => setDraftNameInput(e.target.value)}
                className="mb-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && confirmSaveDraft()}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setIsSavingDraft(false)}
                  className="flex-1 rounded-2xl bg-gray-100 py-4 font-bold text-gray-500"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmSaveDraft}
                  className="flex-1 rounded-2xl bg-indigo-600 py-4 font-bold text-white"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {previewFullImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setPreviewFullImage(null)}
        >
          <button className="absolute top-5 right-5 text-white/50 hover:text-white">
            <X size={32} />
          </button>
          <img
            src={previewFullImage}
            className="max-h-full max-w-full rounded-lg"
            alt="Preview"
          />
        </div>
      )}
      <ConfirmDialog
        isOpen={showOverdueConfirm}
        onClose={() => setShowOverdueConfirm(false)}
        onConfirm={() => {
          setShowOverdueConfirm(false);
          proceedSubmit();
        }}
        title="ยืนยันการสร้างบิลย้อนหลัง?"
        description={
          lateFee && lateFee > 0
            ? `รอบบิลนี้จะครบกำหนดชำระในอดีตไปแล้ว บิลที่สร้างจะถูกตั้งเป็น "เกินกำหนด" ทันที และจะถูกคิดค่าปรับล่าช้าตามจำนวนวันที่เกินกำหนด (${lateFee.toLocaleString()} บาท/วัน) คุณแน่ใจหรือไม่ที่จะสร้างบิลนี้?`
            : "รอบบิลนี้จะครบกำหนดชำระในอดีตไปแล้ว บิลที่สร้างจะถูกตั้งเป็น \"เกินกำหนด\" ทันที คุณแน่ใจหรือไม่ที่จะสร้างบิลนี้?"
        }
        type="warning"
        confirmText="ใช่, สร้างบิลย้อนหลัง"
        cancelText="ยกเลิก"
        isLoading={isSubmitting}
      />
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearAll}
        title="ยืนยันการล้างข้อมูล?"
        description="ข้อมูลห้องพักและเลขมิเตอร์ที่กรอกไว้ทั้งหมดในหน้านี้จะถูกลบออกเพื่อเริ่มต้นใหม่ คุณแน่ใจหรือไม่?"
        type="error"
        confirmText="ใช่, ล้างข้อมูลทั้งหมด"
        cancelText="กลับไปกรอกต่อ"
      />
      <ConfirmDialog
        isOpen={!!draftToDelete}
        onClose={() => setDraftToDelete(null)}
        onConfirm={confirmDeleteDraft}
        title="ยืนยันการลบฉบับร่าง?"
        description="ข้อมูลรายการห้องและรูปภาพมิเตอร์ที่บันทึกไว้ในร่างนี้จะถูกลบออกจากระบบอย่างถาวร คุณแน่ใจหรือไม่?"
        type="error"
        confirmText="ใช่, ลบฉบับร่าง"
        cancelText="ยกเลิก"
      />
      {scanConfig.isOpen && (
        <MeterScannerModal
          key={`${scanConfig.type}-${scanConfig.index}`}
          isOpen={scanConfig.isOpen}
          onClose={() =>
            setScanConfig((prev) => ({
              ...prev,
              isOpen: false,
            }))
          }
          roomId={items[scanConfig.index]?.roomId}
          waterMeterDigits={items[scanConfig.index]?.waterMeterDigits}
          scanType={scanConfig.type}
          roomNumber={items[scanConfig.index]?.roomNumber || ""}
          tenantName={items[scanConfig.index]?.tenantName || ""}
          onConfirm={handleScanConfirm}
          onSkip={handleScanNext}
          onSetupSuccess={() => {
            fetchRooms();
          }}
        />
      )}
    </div>
  );
}
