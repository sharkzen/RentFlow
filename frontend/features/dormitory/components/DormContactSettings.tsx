"use client";
import {
  Phone,
  MessageCircle,
  Facebook,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { DormFormData } from "@/features/dormitory";

interface ContactRow {
  id?: string;
  name?: string;
  phone: string;
}

interface ContactSettingsProps {
  formData: DormFormData;
  updateField: (field: keyof DormFormData, value: any) => void;
}

const Label = ({ icon: Icon, children, required }: any) => (
  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
    {Icon && <Icon size={16} className="text-slate-400" />}
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ className, ...props }: any) => (
  <input
    className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none ${className}`}
    {...props}
  />
);

export default function DormContactSettings({
  formData,
  updateField,
}: ContactSettingsProps) {
  const contacts: ContactRow[] = formData.contacts ?? [];

  const updateContacts = (next: ContactRow[]) => {
    updateField("contacts", next);
  };

  const addContact = () => {
    updateContacts([...contacts, { name: "", phone: "" }]);
  };

  const removeContact = (index: number) => {
    updateContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (
    index: number,
    field: "name" | "phone",
    value: string,
  ) => {
    updateContacts(
      contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
          <Phone size={16} />
          ผู้ติดต่อของหอพักนี้
          <span className="text-red-500">*</span>
        </h3>
        <button
          type="button"
          onClick={addContact}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          <Plus size={14} />
          เพิ่มผู้ติดต่อ
        </button>
      </div>

      {contacts.length === 0 && (
        <p className="mb-4 text-sm text-slate-400">
          กด "เพิ่มผู้ติดต่อ" เพื่อใส่ชื่อและเบอร์โทร (ใส่ได้หลายคน
          เผื่อติดต่อเบอร์แรกไม่ได้) จำเป็นต้องมีอย่างน้อย 1 เบอร์
        </p>
      )}

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={contact.id ?? index}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div>
              <Label icon={User}>ชื่อผู้ติดต่อ</Label>
              <Input
                value={contact.name ?? ""}
                onChange={(e: any) =>
                  updateContact(index, "name", e.target.value)
                }
                placeholder="เช่น เปิ้ล แม่บ้าน"
              />
            </div>
            <div>
              <Label icon={Phone} required>
                เบอร์โทรศัพท์
              </Label>
              <Input
                value={contact.phone ?? ""}
                onChange={(e: any) =>
                  updateContact(index, "phone", e.target.value)
                }
                placeholder="08xxxxxxxx"
              />
            </div>
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="flex h-10.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 md:h-auto md:self-stretch"
            >
              <Trash2 size={14} />
              ลบ
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-xs text-slate-400">
          กรุณากรอก Line หรือ Facebook อย่างน้อย 1 ช่องทาง
          <span className="text-red-500">*</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label icon={MessageCircle}>Line ID</Label>
          <Input
            value={formData.lineId ?? ""}
            onChange={(e: any) => updateField("lineId", e.target.value)}
            placeholder={
              formData.lineType === "OFFICIAL" ? "@therich" : "line_id"
            }
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {formData.lineType === "OFFICIAL"
              ? "ใส่ Line Official ID พร้อม @ ตามปกติ เช่น @therich"
              : "ใส่ Line ID บัญชีส่วนตัว"}
          </p>
        </div>
        <div>
          <Label icon={MessageCircle}>ประเภทบัญชี Line</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField("lineType", "PERSONAL")}
              className={`flex-1 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                (formData.lineType ?? "PERSONAL") === "PERSONAL"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              บัญชีส่วนตัว
            </button>
            <button
              type="button"
              onClick={() => updateField("lineType", "OFFICIAL")}
              className={`flex-1 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                formData.lineType === "OFFICIAL"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              LINE Official
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <Label icon={Facebook}>ลิงก์ Facebook</Label>
          <Input
            value={formData.facebook ?? ""}
            onChange={(e: any) => updateField("facebook", e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </div>
      </div>
    </div>
  );
}
