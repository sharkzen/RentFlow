import { MapPin, Plus } from "lucide-react";
import { Button } from "@/lib/ui/Button";

interface Props {
  onOpenModal: () => void;
}

export const LandmarkHeader = ({ onOpenModal }: Props) => {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <MapPin className="h-8 w-8 text-blue-600" />
          จัดการสถานที่สำคัญ (Landmarks)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          จัดการข้อมูลสถานที่ใกล้เคียงและพิกัดแผนที่สำหรับหอพัก
        </p>
      </div>
      <div className="max-md:flex max-md:w-full max-md:justify-end">
        <Button onClick={onOpenModal}>
          <Plus className="h-4 w-4" />
          เพิ่มสถานที่ใหม่
        </Button>
      </div>
    </div>
  );
};
