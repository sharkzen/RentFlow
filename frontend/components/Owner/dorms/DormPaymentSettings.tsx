import { CreditCard, Wallet, Building2 } from "lucide-react";
import { DormFormData } from "@/features/dormitory";

interface PaymentSettingsProps {
  formData: DormFormData;
  updateField: (field: keyof DormFormData, value: any) => void;
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

export default function DormPaymentSettings({
  formData,
  updateField,
}: PaymentSettingsProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-indigo-600 uppercase">
        <CreditCard size={16} />
        ตั้งค่าบัญชีรับเงิน
      </h3>
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h4 className="mb-2 text-xs font-bold text-slate-400">บัญชีธนาคาร</h4>
        </div>
        <div>
          <Label icon={Building2}>
            ชื่อธนาคาร <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.bankName}
            onChange={(e: any) => updateField("bankName", e.target.value)}
            placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
            required
          />
        </div>
        <div>
          <Label>
            เลขที่บัญชี <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.bankAccount}
            onChange={(e: any) => updateField("bankAccount", e.target.value)}
            placeholder="xxx-x-xxxxx-x"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label>
            ชื่อบัญชี ต้องตรงกลับบัญชีพร้อมเพย์(ถ้ามี){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.bankHolder}
            onChange={(e: any) => updateField("bankHolder", e.target.value)}
            placeholder="ชื่อเจ้าของบัญชี"
            required
          />
        </div>
      </div>
      <div className="border-t border-slate-100 pt-5"></div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h4 className="mb-2 text-xs font-bold text-slate-400">
            พร้อมเพย์ (PromptPay)
          </h4>
        </div>
        <div>
          <Label icon={Wallet}>ประเภทพร้อมเพย์</Label>
          <select
            value={formData.promptPayType || ""}
            onChange={(e) => updateField("promptPayType", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">-- ไม่ระบุ --</option>
            <option value="PHONE">เบอร์โทรศัพท์</option>
            <option value="ID_CARD">บัตรประชาชน</option>
            <option value="E_WALLET">E-Wallet ID</option>
          </select>
        </div>
        <div>
          <Label>เลขพร้อมเพย์ / เบอร์โทร</Label>
          <Input
            value={formData.promptPayValue}
            onChange={(e: any) => updateField("promptPayValue", e.target.value)}
            placeholder="08xxxxxxxx / 1xxxxxxxxxxxx"
          />
        </div>
      </div>
    </div>
  );
}
