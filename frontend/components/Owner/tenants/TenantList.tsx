import { Tenant } from "@/features/tenant";
import { Pencil, UserX, UserCheck, Ban, LogOut } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-max table-auto text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr className="border-b border-gray-100">
              <th className="py-4 pr-3 pl-6 text-xs font-semibold tracking-wider uppercase">
                ชื่อ-สกุล
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider uppercase">
                สถานะ
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider uppercase">
                ห้อง
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider uppercase">
                เบอร์โทร
              </th>
              <th className="hidden px-3 py-4 text-xs font-semibold tracking-wider uppercase md:table-cell">
                อีเมล
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider uppercase">
                เข้าพักเมื่อ
              </th>
              <th className="py-4 pr-6 pl-3 text-right text-xs font-semibold tracking-wider uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td className="py-4 pr-3 pl-6">
                  <Skeleton className="h-5 w-32 rounded bg-gray-100" />
                </td>
                <td className="px-3 py-4">
                  <Skeleton className="h-5 w-20 rounded-full bg-gray-100" />
                </td>
                <td className="px-3 py-4">
                  <Skeleton className="h-6 w-12 rounded bg-gray-100" />
                </td>
                <td className="px-3 py-4">
                  <Skeleton className="h-5 w-24 rounded bg-gray-100" />
                </td>
                <td className="hidden px-3 py-4 md:table-cell">
                  <Skeleton className="h-5 w-40 rounded bg-gray-100" />
                </td>
                <td className="px-3 py-4">
                  <Skeleton className="h-5 w-24 rounded bg-gray-100" />
                </td>
                <td className="py-4 pr-6 pl-3 text-right">
                  <Skeleton className="ml-auto h-8 w-20 rounded-lg bg-gray-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center rounded-xl p-8 text-center">
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <UserX className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          ไม่มีข้อมูลผู้เช่า
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          ยังไม่มีรายชื่อผู้เช่าในรายการนี้
        </p>
      </div>
    );
  }

  return (
    <>
      <EditTenantDialog
        isOpen={!!editingTenantId}
        tenantId={editingTenantId}
        onClose={() => setEditingTenantId(null)}
        onSuccess={handleEditSuccess}
      />
      <div className="r w-full overflow-hidden bg-white transition-all">
        <table className="w-full min-w-max table-auto text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-600 backdrop-blur-sm">
            <tr className="border-b border-gray-200">
              <th className="py-4 pr-3 pl-6 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                ชื่อ-สกุล
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                สถานะ
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                ห้อง
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                เบอร์โทร
              </th>
              <th className="hidden px-3 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase md:table-cell">
                อีเมล
              </th>
              <th className="px-3 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                เข้าพักเมื่อ
              </th>
              <th className="py-4 pr-6 pl-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="group transition-colors hover:bg-gray-50/60"
              >
                <td className="py-4 pr-3 pl-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {tenant.firstName} {tenant.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4">{renderStatusBadge(tenant)}</td>
                <td className="px-3 py-4">
                  {tenant.room ? (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                      {tenant.room.roomNumber}
                    </span>
                  ) : (
                    <span className="pl-1 text-xs text-gray-400 italic">
                      ไม่ระบุ
                    </span>
                  )}
                </td>
                <td className="px-3 py-4">
                  <span className="text-xs text-gray-600">
                    {tenant.phone || "-"}
                  </span>
                </td>
                <td className="hidden px-3 py-4 md:table-cell">
                  <span
                    className="block max-w-35 truncate text-gray-500"
                    title={tenant.email || ""}
                  >
                    {tenant.email || "-"}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className="text-gray-500">
                    {tenant.moveInDate
                      ? new Date(tenant.moveInDate).toLocaleDateString(
                          "th-TH",
                          {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "-"}
                  </span>
                </td>
                <td className="py-4 pr-6 pl-3 text-right">
                  <button
                    onClick={() => handleEditClick(tenant.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                  >
                    <Pencil size={14} />
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
