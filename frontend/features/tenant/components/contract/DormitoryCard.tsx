import { TenantContractDetail } from "@/features/tenant";
import { Wind, Fan } from "lucide-react";

export const DormitoryCard = ({ tenant }: { tenant: TenantContractDetail }) => {
  if (!tenant || !tenant.room) {
    return (
      <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-400">
        ไม่พบข้อมูลการเช่า
      </div>
    );
  }

  const { dormitory } = tenant.room;

  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-sm">
      <div className="p-6 md:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-blue-100/80 uppercase">
              {dormitory.name}
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
              ห้อง {tenant.room.roomNumber}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
                {tenant.room.type === "AIR" ? (
                  <Wind size={13} />
                ) : (
                  <Fan size={13} />
                )}
                {tenant.room.type === "AIR" ? "แอร์" : "พัดลม"} · ชั้น{" "}
                {tenant.room.floor}
              </span>
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50/80">
              {dormitory.address}
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/10 px-5 py-3 text-right backdrop-blur-md">
            <p className="text-[11px] font-medium text-blue-100/80 uppercase">
              ค่าเช่ารายเดือน
            </p>
            <p className="text-2xl font-bold">
              ฿{(tenant.roomPriceSnapshot ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
