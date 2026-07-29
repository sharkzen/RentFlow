import { TenantContractDetail } from "@/features/tenant";
import { Landmark, QrCode } from "lucide-react";

export const PaymentChannelCard = ({
  tenant,
}: {
  tenant: TenantContractDetail;
}) => {
  const paymentSetting = tenant.room.dormitory.paymentSetting;

  return (
    <div className="bg-surface ring-border rounded-2xl p-6 shadow-sm ring-1">
      <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-bold">
        <Landmark size={18} className="text-blue-500" />
        ช่องทางการชำระเงิน
      </h3>
      {paymentSetting?.bankAccount ? (
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-muted text-xs font-medium">
            {paymentSetting.bankName || "ไม่ระบุธนาคาร"}
          </p>
          <p className="text-foreground mt-0.5 text-lg font-bold tracking-wide">
            {paymentSetting.bankAccount}
          </p>
          <p className="text-muted text-sm">{paymentSetting.bankHolder}</p>
        </div>
      ) : (
        <p className="text-muted text-sm">ไม่ได้ตั้งค่าบัญชีธนาคาร</p>
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
