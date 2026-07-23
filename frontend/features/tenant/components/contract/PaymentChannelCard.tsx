import { TenantContractDetail } from "@/features/tenant";
import { Landmark, QrCode } from "lucide-react";

export const PaymentChannelCard = ({
  tenant,
}: {
  tenant: TenantContractDetail;
}) => {
  const paymentSetting = tenant.room.dormitory.paymentSetting;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Landmark size={18} className="text-blue-500" />
        ช่องทางการชำระเงิน
      </h3>
      {paymentSetting?.bankAccount ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-400">
            {paymentSetting.bankName || "ไม่ระบุธนาคาร"}
          </p>
          <p className="mt-0.5 text-lg font-bold tracking-wide text-slate-800">
            {paymentSetting.bankAccount}
          </p>
          <p className="text-sm text-slate-500">{paymentSetting.bankHolder}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">ไม่ได้ตั้งค่าบัญชีธนาคาร</p>
      )}
      {paymentSetting?.promptPayValue && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <QrCode size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs leading-none text-blue-500">พร้อมเพย์</p>
            <p className="truncate font-bold text-blue-900">
              {paymentSetting.promptPayValue}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
