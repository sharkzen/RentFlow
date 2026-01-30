import React from "react";
import { OwnerApproval } from "@/features/admin/services/approval.service";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Eye, Clock } from "lucide-react";

interface Props {
  data: OwnerApproval[];
  onView: (item: OwnerApproval) => void;
}

export default function ApprovalTable({ data, onView }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
        <Clock className="mb-2 h-10 w-10 opacity-50" />
        <p>ไม่มีรายการที่รออนุมัติ</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">วันที่สมัคร</th>
              <th className="px-6 py-4 font-semibold">ผู้สมัคร (Owner)</th>
              <th className="px-6 py-4 font-semibold">ช่องทางติดต่อ</th>
              <th className="px-6 py-4 font-semibold">สถานะ</th>
              <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-gray-50/60"
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {format(new Date(item.createdAt), "d MMM yy HH:mm", {
                    locale: th,
                  })}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{item.user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex flex-col text-xs">
                    {item.phone && <span>Tel: {item.phone}</span>}
                    {item.lineId && (
                      <span className="text-green-600">
                        Line: {item.lineId}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-orange-500"></span>
                    รอตรวจสอบ
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onView(item)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    <Eye size={14} />
                    ตรวจสอบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
