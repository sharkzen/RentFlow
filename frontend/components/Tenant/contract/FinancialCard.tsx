import { TenantContractDetail } from "@/features/tenant";
import { Zap, Droplets, Calendar, CreditCard } from "lucide-react";

export const FinancialCard = ({ tenant }: { tenant: TenantContractDetail }) => {
  const rates = tenant.room.dormitory.settings;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
        <CreditCard className="text-blue-500" />
        ข้อมูลค่าใช้จ่ายและระเบียบ
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl bg-blue-50/50 p-4 ring-1 ring-blue-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase">
              ค่าน้ำมิตเตอร์
            </p>
            <p className="text-xl font-black text-blue-900">
              {rates.waterRate}{" "}
              <span className="text-sm font-normal">บาท/หน่วย</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-amber-50/50 p-4 ring-1 ring-amber-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase">
              ค่าไฟฟ้ามิตเตอร์
            </p>
            <p className="text-xl font-black text-amber-900">
              {rates.electricRate}{" "}
              <span className="text-sm font-normal">บาท/หน่วย</span>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-500">
            <Calendar size={14} />
            กำหนดชำระทุกวันที่
          </span>
          <span className="font-bold text-slate-900">
            {rates.dueDay}ของทุกเดือน
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">เงินประกันความเสียหาย</span>
          <span className="font-bold text-slate-900">
            {tenant.securityDeposit.toLocaleString()}บาท
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">ค่าเช่าล่วงหน้า</span>
          <span className="font-bold text-slate-900">
            {tenant.advancePayment.toLocaleString()}บาท
          </span>
        </div>
      </div>
    </div>
  );
};
