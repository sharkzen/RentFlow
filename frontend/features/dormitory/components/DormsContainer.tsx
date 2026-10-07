"use client";
import { useState } from "react";
import DormsCard from "./DormsCard";
import DormsDialog from "./DormsDialog";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { Plus, Building2, Ban, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOwnerBilling } from "@/features/billing/context/OwnerBillingContext";
import DromCreate from "./DromCreate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dormitory } from "@/features/dormitory";
import LoadingPage from "@/app/(owner)/owner/dorms/loading";

export default function DormsContainer() {
  const queryClient = useQueryClient();
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [onCreate, setOnCreate] = useState(false);
  const router = useRouter();
  const { billing } = useOwnerBilling();
  // สร้างหอครบตามโควต้าแพ็คเกจแล้ว (ยังไม่มีแพ็คเกจ = 1 หอ) ปุ่มล็อกและพาไปเลือกแพ็คเกจ
  const dormLimitReached =
    !!billing?.enforced && billing.usage.dorms >= billing.plan.maxDorms;

  const openCreate = () => {
    if (dormLimitReached) {
      router.push("/owner/billing");
      return;
    }
    setOnCreate(true);
  };

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

  if (isLoading) return <LoadingPage />;

  return (
    <div className="container">
      {onCreate && (
        <DromCreate
          onClose={() => setOnCreate(false)}
          onSuccess={refreshDorms}
        />
      )}
      <div className="border-border mb-8 flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            หอพักของคุณ
          </h2>
          <p className="text-muted mt-1 text-sm">
            จัดการรายการหอพัก ข้อมูลราคา และสถานะการเผยแพร่
          </p>
        </div>
        <div className="flex max-sm:w-full max-sm:justify-end">
          <button
            onClick={openCreate}
            title={
              dormLimitReached
                ? "สร้างหอได้ตามโควต้าแพ็คเกจแล้ว อัปเกรดเพื่อเพิ่มหอ"
                : undefined
            }
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 max-sm:w-full ${dormLimitReached ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-linear-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"}`}
          >
            {dormLimitReached ? (
              <Lock size={18} strokeWidth={2.5} />
            ) : (
              <Plus size={18} strokeWidth={2.5} />
            )}
            <span>เพิ่มหอพักใหม่</span>
          </button>
        </div>
      </div>
      {dorms.length === 0 ? (
        <div className="border-border bg-background flex h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center">
          <div className="bg-surface mb-4 rounded-full p-4">
            <Building2 className="text-muted h-10 w-10" />
          </div>
          <h3 className="text-foreground text-lg font-medium">ยังไม่มีหอพัก</h3>
          <p className="text-muted mt-1 text-sm">
            เริ่มต้นด้วยการสร้างหอพักแรกของคุณ
          </p>
          <button
            onClick={openCreate}
            className="mt-4 font-medium text-indigo-600 hover:underline"
          >
            สร้างหอพักเลย
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dorms.map((dorm) => {
            const isBanned = dorm.status === "BANNED";

            return (
              <div key={dorm.id} className="group relative">
                {isBanned && (
                  <div className="absolute inset-0 z-10 flex cursor-not-allowed flex-col items-center justify-center rounded-2xl bg-white/40 backdrop-blur-[0.5px]">
                    <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                      <Ban size={16} strokeWidth={2.5} />
                      ถูกระงับโดยแอดมิน
                    </span>
                  </div>
                )}
                <div
                  className={
                    isBanned
                      ? "pointer-events-none opacity-50 grayscale-[40%] transition-all select-none"
                      : "transition-all"
                  }
                >
                  <DormsCard
                    dorm={dorm}
                    onEdit={() => {
                      if (!isBanned) setSelectedDorm(dorm);
                    }}
                    onTogglePublish={(value) =>
                      queryClient.setQueryData<Dormitory[]>(["dorms"], (old) =>
                        old?.map((d) =>
                          d.id === dorm.id ? { ...d, isPublished: value } : d,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
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
