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
      <div className="border-border bg-surface flex h-64 w-full items-center justify-center rounded-xl border shadow-sm">
        <div className="flex animate-pulse flex-col items-center">
          <div className="bg-skeleton mb-2 h-4 w-4 rounded-full"></div>
          <span className="text-muted text-sm">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border-border bg-surface text-muted flex w-full flex-col items-center justify-center rounded-xl border py-16">
        <MapPinOff className="mb-3 h-12 w-12 opacity-50" />
        <p>ไม่พบข้อมูลสถานที่</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        <table className="text-muted min-w-full text-left text-sm">
          <thead className="border-border bg-background text-foreground border-b font-semibold">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">ชื่อสถานที่</th>
              <th className="px-6 py-4 whitespace-nowrap">ประเภท</th>
              <th className="px-6 py-4 whitespace-nowrap">พิกัด (Lat, Lng)</th>
              <th className="px-6 py-4 whitespace-nowrap">แผนที่</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-background transition-colors"
              >
                <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {item.type.replace("_", " ")}
                  </span>
                </td>
                <td className="text-muted px-6 py-4 font-mono text-xs whitespace-nowrap">
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
      <div className="border-border bg-background flex items-center justify-between border-t px-6 py-4">
        <span className="text-muted text-xs">
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
