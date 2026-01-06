import { TenantListResponse, Tenant } from "@/features/tenant";
import { Pencil, UserX } from "lucide-react";

interface Props {
  tenants: TenantListResponse;
  onEdit?: (tenant: Tenant) => void;
}

export default function TenantList({ tenants, onEdit }: Props) {
  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="mb-3 rounded-full bg-gray-50 p-4 ring-1 ring-gray-100">
          <UserX className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900">
          ไม่มีข้อมูลผู้เช่า
        </h3>
        <p className="mt-1 text-sm text-gray-500">ยังไม่มีผู้เช่าในหอพักนี้</p>
      </div>
    );
  }

  return (
    <table className="w-full min-w-max table-auto text-left text-sm">
      <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">
        <tr>
          <th className="border-b border-gray-200 py-3 pr-3 pl-6 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            ชื่อ-สกุล
          </th>
          <th className="border-b border-gray-200 px-3 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            ห้อง
          </th>
          <th className="border-b border-gray-200 px-3 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            เบอร์โทร
          </th>
          <th className="border-b border-gray-200 px-3 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            อีเมล
          </th>
          <th className="border-b border-gray-200 px-3 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            วันที่เข้าพัก
          </th>
          <th className="border-b border-gray-200 py-3 pr-6 pl-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
            จัดการ
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {tenants.map((tenant) => (
          <tr
            key={tenant.id}
            className="group transition-colors hover:bg-gray-50/80"
          >
            <td className="py-4 pr-3 pl-6 font-medium whitespace-nowrap text-gray-900">
              {tenant.firstName} {tenant.lastName}
            </td>
            <td className="px-3 py-4 whitespace-nowrap">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">
                {tenant.room.roomNumber}
              </span>
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-gray-500">
              {tenant.phone || <span className="text-gray-300">-</span>}
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-gray-500">
              {tenant.email || <span className="text-gray-300">-</span>}
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-gray-500">
              {tenant.moveInDate ? (
                new Date(tenant.moveInDate).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </td>
            <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
              <button
                onClick={() => onEdit && onEdit(tenant)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                แก้ไข
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
