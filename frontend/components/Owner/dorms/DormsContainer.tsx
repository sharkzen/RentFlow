"use client";

import { useCallback, useEffect, useState } from "react";
import DormsCard from "./DormsCard";
import DormsDialog from "./DormsDialog";
import { Dormitory } from "@/features/dormitory";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { PlusIcon } from "lucide-react";
import DromCreate from "./DromCreate";
export default function DormsContainer() {
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);

  const [onCreate, setOnCreate] = useState(false);

  const fetchDorms = useCallback(async () => {
    const data = await DormService.getDorm();
    setDorms(data);
  }, []);

  useEffect(() => {
    fetchDorms();
  }, [fetchDorms]);

  const handleCloseDialog = () => {
    setSelectedDorm(null);
    fetchDorms();
  };

  return (
    <>
      {onCreate && (
        <DromCreate onClose={() => setOnCreate(false)} onSuccess={fetchDorms} />
      )}

      <div className="mb-8 flex items-end justify-between transition-all">
        <div>
          <h2 className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent">
            หอพักของคุณ
          </h2>
        </div>
        <div>
          <button
            onClick={() => setOnCreate(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <span>เพิ่มหอพัก</span>
            <PlusIcon size={18} />
          </button>
        </div>
      </div>
      <div className="grid max-h-screen grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {dorms.map((dorm) => (
          <DormsCard
            key={dorm.id}
            dorm={dorm}
            onEdit={() => setSelectedDorm(dorm)}
          />
        ))}
      </div>

      {selectedDorm && (
        <DormsDialog
          dorm={selectedDorm}
          onClose={handleCloseDialog}
          onEdit={fetchDorms}
        />
      )}
    </>
  );
}
