import { Tenant } from "@/features/tenant";
import {
  Pencil,
  UserX,
  UserCheck,
  Ban,
  LogOut,
  Loader2,
  Phone,
  Calendar,
  Mail,
} from "lucide-react";
import { useState } from "react";
import EditTenantDialog from "./EditTenantDialog";
import Skeleton from "@/lib/ui/Skeleton";
import AddTenantDialog from "./AddTenantDialog";

interface Props {
  tenants: Tenant[];
  isLoading: boolean;
  onEditSuccess?: () => void;
  dormId: string;
}

export default function TenantList({
  tenants,
  isLoading,
  onEditSuccess,
  dormId,
}: Props) {
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);

  const handleEditClick = (e: React.MouseEvent, tenantId: string) => {
    e.stopPropagation();
    setEditingTenantId(tenantId);
  };

  const handleEditSuccess = () => {
    setEditingTenantId(null);
    onEditSuccess?.();
  };

  const handleReEntryFromEdit = (data: any) => {
    setEditingTenantId(null);
    setPrefilledData(data);
    setIsAddOpen(true);
  };

  const renderStatusBadge = (tenant: Tenant) => {
    if (!tenant.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
          <LogOut size={12} />
          <span className="hidden sm:inline">ย้ายออก</span>
        </span>
      );
    }

    const status = tenant.user?.status || "ACTIVE";

    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
            <UserCheck size={12} />
            <span className="hidden sm:inline">ปกติ</span>
          </span>
        );
      case "BANNED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
            <Ban size={12} />
            <span className="hidden sm:inline">ระงับ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">
            รออนุมัติ
          </span>
        );
    }
  };

  const gridTemplate =
    "grid-cols-[1.5fr_0.8fr_0.8fr_100px] md:grid-cols-[1.5fr_0.8fr_0.8fr_1.2fr_1.5fr_1fr_100px]";

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div
          className={`grid ${gridTemplate} gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4`}
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
          <Skeleton className="h-4 w-10 justify-self-end" />
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
          onReEntry={handleReEntryFromEdit}
        />
      )}
      {isAddOpen && (
        <AddTenantDialog
          isOpen={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
            setPrefilledData(null);
          }}
          dormId={dormId}
          initialData={prefilledData}
          onSuccess={onEditSuccess!}
        />
      )}
      <div className="flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div
          className={`grid ${gridTemplate} shrink-0 items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase sm:px-6 sm:py-4`}
        >
          <div>ชื่อ-สกุล</div>
          <div>ห้อง</div>
          <div>สถานะ</div>
          <div className="hidden md:block">เบอร์โทร</div>
          <div className="hidden md:block">อีเมล</div>
          <div className="hidden md:block">เข้าพักเมื่อ</div>
          <div className="text-right">จัดการ</div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-white">
          <div className="min-w-full">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                onClick={(e) => handleEditClick(e, tenant.id)}
                className={`group grid ${gridTemplate} cursor-pointer items-center gap-4 border-b border-gray-100 px-4 py-4 transition-colors last:border-0 hover:bg-gray-50/80 sm:px-6`}
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-gray-900">
                    {tenant.firstName} {tenant.lastName}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500 md:hidden">
                    {tenant.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {tenant.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {tenant.room ? (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                      {tenant.room.roomNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">-</span>
                  )}
                </div>
                <div>{renderStatusBadge(tenant)}</div>
                <div className="hidden truncate text-xs text-gray-600 md:block">
                  {tenant.phone || "-"}
                </div>
                <div className="hidden overflow-hidden md:block">
                  <span
                    className="block truncate text-xs text-gray-500"
                    title={tenant.email || ""}
                  >
                    {tenant.email || "-"}
                  </span>
                </div>
                <div className="hidden text-xs text-gray-500 md:block">
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
                    onClick={(e) => handleEditClick(e, tenant.id)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
                    title="แก้ไขข้อมูล"
                  >
                    <Pencil size={14} />
                    <span className="hidden text-xs font-medium sm:inline">
                      แก้ไข
                    </span>
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
