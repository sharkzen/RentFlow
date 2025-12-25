import { useState } from "react";

type Tenant = { id?: string; name: string; room: string; dormitoryId?: string };

type Props = {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
};

export default function TenantFormDialog({ tenant, onClose, onSave }: Props) {
  const [name, setName] = useState(tenant?.name || "");
  const [room, setRoom] = useState(tenant?.room || "");

  const handleSubmit = () => {
    if (!name || !room) return alert("กรุณากรอกข้อมูลให้ครบ");
    onSave({ ...tenant, name, room });
  };

  return (
    <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-80 space-y-4 rounded bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {tenant ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"}
        </h2>
        <div className="space-y-2">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="ชื่อผู้เช่า"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="หมายเลขห้อง"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="rounded border px-4 py-2 hover:bg-gray-100"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={handleSubmit}
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
