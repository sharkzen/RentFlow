import { Building2 } from "lucide-react";
import { CustomSelect } from "@/lib/ui/CustomSelect";

type Props = {
  dormitories: {
    id: string;
    name: string;
  }[];
  selectedDorm: {
    id: string;
    name: string;
  };
  onChange: (dorm: { id: string; name: string }) => void;
};

export default function DormitorySelector({
  dormitories,
  selectedDorm,
  onChange,
}: Props) {
  return (
    <CustomSelect
      icon={<Building2 size={16} />}
      options={dormitories.map((d) => ({ value: d.id, label: d.name }))}
      value={selectedDorm.id}
      onChange={(id) => {
        const dorm = dormitories.find((d) => d.id === id);

        if (dorm) onChange(dorm);
      }}
    />
  );
}
