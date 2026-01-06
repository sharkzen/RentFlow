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
    <select
      className="rounded border px-3 py-2"
      value={selectedDorm.id}
      onChange={(e) => {
        const dorm = dormitories.find((d) => d.id === e.target.value);

        if (dorm) onChange(dorm);
      }}
    >
      {dormitories.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
