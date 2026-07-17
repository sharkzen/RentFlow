import { ExternalLink, Trash2, MapPinOff, Pencil } from "lucide-react";
import { Landmark } from "@/features/admin";
import { Button } from "@/lib/ui/Button";

interface Props {
  data: Landmark[];
  isLoading: boolean;
  onDeleteClick: (landmark: Landmark) => void;
  onEditClick: (landmark: Landmark) => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const LandmarkTable = ({
  data,
  isLoading,
  onDeleteClick,
  onEditClick,
  page,
  totalPages,
  onPageChange,
}: Props) => {
  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex animate-pulse flex-col items-center">
          <div className="mb-2 h-4 w-4 rounded-full bg-gray-200"></div>
          <span className="text-sm text-gray-400">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16 text-gray-400">
        <MapPinOff className="mb-3 h-12 w-12 opacity-50" />
        <p>ไม่พบข้อมูลสถานที่</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-600">
          <thead className="border-b border-gray-100 bg-gray-50 font-semibold text-gray-900">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">ชื่อสถานที่</th>
              <th className="px-6 py-4 whitespace-nowrap">ประเภท</th>
              <th className="px-6 py-4 whitespace-nowrap">พิกัด (Lat, Lng)</th>
              <th className="px-6 py-4 whitespace-nowrap">แผนที่</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4 font-medium whitespace-nowrap text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {item.type.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-500">
                  {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={item.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-fit items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    เปิดดู
                  </a>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditClick(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteClick(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
        <span className="text-xs text-gray-500">
          หน้า {page}จาก {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
};
