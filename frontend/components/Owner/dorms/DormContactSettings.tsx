import { User, Phone, Facebook, MessageCircle } from "lucide-react";

interface ContactSettingsProps {
  formData: any;
  updateField: (field: string, value: any) => void;
}

const Label = ({ icon: Icon, children }: any) => (
  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
    {Icon && <Icon size={16} className="text-slate-400" />}
    {children}
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
        <User size={16} />
        ข้อมูลการติดต่อ (Owner Profile)
      </h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label icon={User}>ชื่อผู้ดูแล / เจ้าของหอ</Label>
          <Input
            value={formData.ownerName}
            onChange={(e: any) => updateField("ownerName", e.target.value)}
            placeholder="ชื่อ-นามสกุล"
          />
        </div>
        <div>
          <Label icon={Phone}>เบอร์โทรศัพท์</Label>
          <Input
            value={formData.phone}
            onChange={(e: any) => updateField("phone", e.target.value)}
            placeholder="08x-xxx-xxxx"
          />
        </div>
        <div>
          <Label icon={MessageCircle}>Line ID</Label>
          <Input
            value={formData.lineId}
            onChange={(e: any) => updateField("lineId", e.target.value)}
            placeholder="@lineid"
          />
        </div>
        <div className="md:col-span-2">
          <Label icon={Facebook}>Facebook Link / Page</Label>
          <Input
            value={formData.facebook}
            onChange={(e: any) => updateField("facebook", e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </div>
      </div>
    </div>
  );
}
