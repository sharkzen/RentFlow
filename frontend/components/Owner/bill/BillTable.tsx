import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Bill } from "@/features/bill/types";

interface Props {
  bills: Bill[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetail: (bill: Bill) => void;
}

export default function BillTable({
  bills,
  isLoading,
  onViewDetail,
  onUpdateStatus,
}: Props) {
  if (isLoading)
    return <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>;

  if (bills.length === 0)
    return <div className="p-10 text-center text-gray-500">ไม่พบรายการบิล</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
            ชำระแล้ว
          </span>
        );
      case "PENDING":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
            รอชำระ
          </span>
        );
      case "OVERDUE":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            เกินกำหนด
          </span>
        );
      case "CANCELLED":
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
            ยกเลิก
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
          <tr>
            <th className="px-6 py-3">ห้อง</th>
            <th className="px-6 py-3">ผู้เช่า</th>
            <th className="px-6 py-3">ประจำเดือน</th>
            <th className="px-6 py-3">ยอดรวม</th>
            <th className="px-6 py-3">สถานะ</th>
            <th className="px-6 py-3 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {bills.map((bill) => (
            <tr
              key={bill.id}
              onClick={() => onViewDetail(bill)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-6 py-4 font-medium text-gray-900">
                {bill.roomNumberSnapshot}
              </td>
              <td className="px-6 py-4">{bill.tenantNameSnapshot}</td>
              <td className="px-6 py-4">
                {new Date(bill.billingMonth).toLocaleDateString("th-TH", {
                  month: "long",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4 font-bold text-indigo-600">
                ฿{bill.total.toLocaleString()}
              </td>
              <td className="px-6 py-4">{getStatusBadge(bill.status)}</td>
              <td className="px-6 py-4 text-right">
                <div
                  className="flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {bill.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(bill.id, "PAID")}
                        className="rounded p-1 text-green-600 transition-colors hover:bg-green-50"
                        title="แจ้งชำระ"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(bill.id, "CANCELLED")}
                        className="rounded p-1 text-red-500 transition-colors hover:bg-red-50"
                        title="ยกเลิกบิล"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  <button
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    onClick={() => onViewDetail(bill)}
                    title="ดูรายละเอียด"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
