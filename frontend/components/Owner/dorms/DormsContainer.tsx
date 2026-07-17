"use client";
import { useState } from "react";
import DormsCard from "./DormsCard";
import DormsDialog from "./DormsDialog";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Plus, Building2 } from "lucide-react";
import DromCreate from "./DromCreate";
import { Spinner } from "@/lib/ui/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dormitory } from "@/features/dormitory";

export default function DormsContainer() {
  const queryClient = useQueryClient();
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [onCreate, setOnCreate] = useState(false);

  const { data: dorms = [], isLoading } = useQuery<Dormitory[]>({
    queryKey: ["dorms"],
    queryFn: () => DormService.getDorm(),
  });

  const refreshDorms = () => {
    queryClient.invalidateQueries({
      queryKey: ["dorms"],
    });
  };

  const handleCloseDialog = () => {
    setSelectedDorm(null);
  };

  return (
    <div className="container">
      {onCreate && (
        <DromCreate
          onClose={() => setOnCreate(false)}
          onSuccess={refreshDorms}
        />
      )}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            หอพักของคุณ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            จัดการรายการหอพัก ข้อมูลราคา และสถานะการเผยแพร่
          </p>
        </div>
        <div className="flex max-sm:w-full max-sm:justify-end">
          <button
            onClick={() => setOnCreate(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-blue-200 transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-lg active:scale-95 max-sm:w-full"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>เพิ่มหอพักใหม่</span>
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : dorms.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Building2 className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">ยังไม่มีหอพัก</h3>
          <p className="mt-1 text-sm text-slate-500">
            เริ่มต้นด้วยการสร้างหอพักแรกของคุณ
          </p>
          <button
            onClick={() => setOnCreate(true)}
            className="mt-4 font-medium text-indigo-600 hover:underline"
          >
            สร้างหอพักเลย
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dorms.map((dorm) => (
            <DormsCard
              key={dorm.id}
              dorm={dorm}
              onEdit={() => setSelectedDorm(dorm)}
            />
          ))}
        </div>
      )}
      {selectedDorm && (
        <DormsDialog
          dorm={selectedDorm}
          onClose={() => {
            handleCloseDialog();
          }}
          onEdit={refreshDorms}
          onRefresh={refreshDorms}
        />
      )}
    </div>
  );
}
