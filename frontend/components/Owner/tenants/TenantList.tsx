import { Tenant } from "@/features/tenant";
import { Pencil, UserX, UserCheck, Ban, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import EditTenantDialog from "./EditTenantDialog";
import Skeleton from "@/components/ui/Skeleton";

interface Props {
  tenants: Tenant[];
  isLoading: boolean;
  onEditSuccess?: () => void;
}

export default function TenantList({
  tenants,
  isLoading,
  onEditSuccess,
}: Props) {
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  const handleEditClick = (tenantId: string) => {
    setEditingTenantId(tenantId);
  };

  const handleEditSuccess = () => {
    setEditingTenantId(null);
    onEditSuccess?.();
  };

  const renderStatusBadge = (tenant: Tenant) => {
    if (!tenant.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
          <LogOut size={12} />
          ย้ายออก
        </span>
      );
    }

    const status = tenant.user?.status || "ACTIVE";

    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
            <UserCheck size={12} />
            ปกติ
          </span>
        );
      case "BANNED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
            <Ban size={12} />
            ระงับ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">
            รออนุมัติ
          </span>
        );
    }
  };

  const gridTemplate = "grid-cols-[1.5fr_1fr_0.8fr_1fr_1.5fr_1fr_100px]";

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`grid ${gridTemplate} gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4`}
        >
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm">กำลังโหลดรายชื่อ...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-4 shadow-sm ring-1 ring-gray-100">
            <UserX className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            ไม่มีข้อมูลผู้เช่า
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            ยังไม่มีรายชื่อผู้เช่าในรายการนี้
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {editingTenantId && (
        <EditTenantDialog
          isOpen={!!editingTenantId}
          tenantId={editingTenantId}
          onClose={() => setEditingTenantId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      <div className="flex h-[60vh] w-full flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`grid ${gridTemplate} shrink-0 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase`}
        >
          <div>ชื่อ-สกุล</div>
          <div>สถานะ</div>
          <div>ห้อง</div>
          <div>เบอร์โทร</div>
          <div className="hidden md:block">อีเมล</div>
          <div>เข้าพักเมื่อ</div>
          <div className="text-right">จัดการ</div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-auto bg-white">
          <div className="min-w-335">
            {" "}
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`group grid ${gridTemplate} items-center gap-4 border-b border-gray-100 px-6 py-4 transition-colors last:border-0 hover:bg-gray-50/60`}
              >
                <div className="flex flex-col">
                  <span className="truncate font-medium text-gray-900">
                    {tenant.firstName} {tenant.lastName}
                  </span>
                </div>
                <div>{renderStatusBadge(tenant)}</div>
                <div>
                  {tenant.room ? (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                      {tenant.room.roomNumber}
                    </span>
                  ) : (
                    <span className="pl-1 text-xs text-gray-400 italic">
                      ไม่ระบุ
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {tenant.phone || "-"}
                </div>
                <div className="hidden md:block">
                  <span
                    className="block max-w-[180px] truncate text-xs text-gray-500"
                    title={tenant.email || ""}
                  >
                    {tenant.email || "-"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {tenant.moveInDate
                    ? new Date(tenant.moveInDate).toLocaleDateString("th-TH", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleEditClick(tenant.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                  >
                    <Pencil size={14} />
                    แก้ไข
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
