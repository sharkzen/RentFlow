import { TenantContractDetail } from "@/features/tenant";

export const DormitoryCard = ({ tenant }: { tenant: TenantContractDetail }) => {
  const { dormitory } = tenant.room;

  const { paymentSetting } = dormitory;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-100 uppercase opacity-80">
              Room Information
            </p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">
              ห้อง {tenant.room.roomNumber}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50 opacity-90">
              {dormitory.address}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md">
            <p className="text-[10px] font-bold text-blue-200 uppercase">
              ค่าเช่ารายเดือน
            </p>
            <p className="text-2xl font-black">
              ฿{tenant.roomPriceSnapshot.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 md:p-8">
        <h4 className="mb-4 text-sm font-bold text-slate-800">
          ช่องทางการชำระเงิน
        </h4>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-60 flex-1 rounded-2xl border-2 border-dashed border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">
              {paymentSetting.bankName}
            </p>
            <p className="text-lg font-black text-slate-800">
              {paymentSetting.bankAccount}
            </p>
            <p className="text-sm text-slate-500">
              {paymentSetting.bankHolder}
            </p>
          </div>
          {paymentSetting.promptPayValue && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4">
              <div className="h-8 w-8 rounded bg-blue-900 p-1.5 text-[10px] leading-none font-bold text-white">
                Prompt Pay
              </div>
              <div>
                <p className="text-xs leading-none text-slate-500">พร้อมเพย์</p>
                <p className="font-bold text-slate-800">
                  {paymentSetting.promptPayValue}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
