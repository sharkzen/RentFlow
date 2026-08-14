"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { RoomService } from "@/features/room/services/room.service";
import { Dormitory } from "@/features/dormitory";
import CreateRoomWithDialog from "./CreateRoomWithDialog";
import RoomCard from "./RoomCard";
import RoomFilters from "./RoomFilters";
import log from "@/lib/logger";
import { useOnClickOutside } from "usehooks-ts";
import LoadingPage from "@/app/(owner)/owner/rooms/loading";

export default function RoomContainer() {
  const [open, setOpen] = useState(false);
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [floorFilter, setFloorFilter] = useState("");
  const [selectedDormId, setSelectedDormId] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(menuRef as React.RefObject<HTMLDivElement>, () =>
    setOpen(false),
  );

  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDorms = useCallback(async () => {
    try {
      const data = await DormService.getDorm();
      setDorms(data);
    } catch (error) {
      log.error("Failed to fetch dorms", error);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await RoomService.getRoomsByDormitory(selectedDormId, {
        search: search,
        status: statusFilter,
        type: typeFilter,
        floor: floorFilter,
        page: page,
        limit: 10,
      });

      setRooms(res.data);

      setMeta({
        total: res.meta.total,
        totalPages: res.meta.totalPages,
      });
    } catch (error) {
      log.error("Failed to fetch rooms", error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDormId, search, statusFilter, typeFilter, page, floorFilter]);

  const getSelectedDormName = () => {
    if (selectedDormId === "ALL") return "ทั้งหมดทุกหอพัก";

    return dorms.find((d) => d.id === selectedDormId)?.name ?? "เลือกหอพัก";
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, selectedDormId]);

  useEffect(() => {
    fetchDorms();
  }, [fetchDorms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchRooms]);

  if (isLoading || !dorms) return <LoadingPage />;

  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            ห้องพัก
          </h2>
          <p className="text-muted text-sm sm:text-base">
            จัดการข้อมูลห้องพักและสถานะ
          </p>
        </div>
        <div className="flex w-full flex-col justify-between gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div ref={menuRef} className="relative w-full sm:w-64">
            <button
              onClick={() => setOpen((v) => !v)}
              className="border-border bg-surface text-foreground flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              <div className="flex flex-col items-start">
                <span className="truncate font-semibold text-blue-600">
                  {getSelectedDormName()}
                </span>
              </div>
              <ChevronDown
                className={`text-muted h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div className="border-border bg-surface absolute top-full right-0 z-50 mt-2 max-h-60 w-full overflow-hidden overflow-y-auto rounded-xl border shadow-xl ring-1 ring-black/5">
                <div className="space-y-1 p-1">
                  <button
                    onClick={() => {
                      setSelectedDormId("ALL");
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition ${selectedDormId === "ALL" ? "bg-blue-50 font-medium text-blue-700" : "text-foreground hover:bg-background"}`}
                  >
                    <span className="truncate">ทั้งหมดทุกหอพัก</span>
                    {selectedDormId === "ALL" && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                  {dorms.map((dorm) => {
                    const active = dorm.id === selectedDormId;

                    return (
                      <button
                        key={dorm.id}
                        onClick={() => {
                          setSelectedDormId(dorm.id);
                          setOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? "bg-blue-50 font-medium text-blue-700" : "text-foreground hover:bg-background"}`}
                      >
                        <span className="truncate">{dorm.name}</span>
                        {active && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0">
            <CreateRoomWithDialog
              dormId={selectedDormId === "ALL" ? undefined : selectedDormId}
              dormName={
                selectedDormId === "ALL"
                  ? ""
                  : dorms.find((d) => d.id === selectedDormId)?.name || ""
              }
              dorms={dorms}
              onSuccess={() => {
                fetchRooms();
              }}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      </div>
      <RoomFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        floorFilter={floorFilter}
        setFloorFilter={setFloorFilter}
        setTypeFilter={setTypeFilter}
      />
      <div className="min-w-0">
        <RoomCard
          rooms={rooms}
          loading={isLoading}
          page={page}
          setPage={setPage}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onRefresh={fetchRooms}
        />
      </div>
    </div>
  );
}
