import { TenantContractDetail } from "@/features/tenant";
import { Zap, Droplets, Calendar, Wallet, ShieldCheck } from "lucide-react";
const formatMoney = (n: number) => `฿${(n ?? 0).toLocaleString()}`;

export const FinancialCard = ({ tenant }: { tenant: TenantContractDetail }) => {
  const settings = tenant.room.dormitory.settings;

  const moneyItems = [
    {
      label: "เงินประกันความเสียหาย",
      value: tenant.securityDeposit ?? 0,
      icon: ShieldCheck,
    },
    {
      label: "ค่าเช่าล่วงหน้า",
      value: tenant.advancePayment ?? 0,
      icon: Wallet,
    },
    {
      label: "ค่าแรกเข้า",
      value: tenant.entranceFee ?? 0,
      icon: Wallet,
    },
  ];

  const totalUpfront =
    (tenant.securityDeposit ?? 0) +
    (tenant.advancePayment ?? 0) +
    (tenant.entranceFee ?? 0);

  return (
    <div className="bg-surface ring-border rounded-2xl p-6 shadow-sm ring-1 md:p-7">
      <h3 className="text-foreground mb-5 text-sm font-bold">
        ค่าใช้จ่ายตามสัญญา
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {moneyItems.map((item) => (
          <div
            key={item.label}
            className="border-border bg-background rounded-xl border p-4"
          >
            <div className="text-muted flex items-center gap-1.5 text-xs font-medium">
              <item.icon size={14} />
              {item.label}
            </div>
            <p className="text-foreground mt-1.5 text-lg font-bold">
              {formatMoney(item.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
        <span className="text-sm font-semibold text-blue-700">
          ยอดรวมที่ชำระตอนทำสัญญา
        </span>
        <span className="text-lg font-bold text-blue-700">
          {formatMoney(totalUpfront)}
        </span>
      </div>
      <h4 className="text-foreground mt-6 mb-3 text-sm font-bold">
        อัตราค่าน้ำ-ไฟ และรอบบิล
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl bg-blue-50/60 p-4 ring-1 ring-blue-100">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600">
              ค่าน้ำ
              {settings.waterBillingType === "FLAT_RATE" && " (เหมาจ่าย)"}
            </p>
            <p className="text-lg font-bold text-blue-900">
              {settings.waterRate}{" "}
              <span className="text-xs font-normal">
                {settings.waterBillingType === "FLAT_RATE"
                  ? "บาท/เดือน"
                  : "บาท/หน่วย"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-amber-50/60 p-4 ring-1 ring-amber-100">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600">ค่าไฟ</p>
            <p className="text-lg font-bold text-amber-900">
              {settings.electricRate}{" "}
              <span className="text-xs font-normal">บาท/หน่วย</span>
            </p>
          </div>
        </div>
      </div>
      <div className="bg-background mt-4 space-y-2.5 rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">ค่าส่วนกลาง</span>
          <span className="text-foreground font-semibold">
            {formatMoney(settings.commonFee)}/เดือน
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">ค่าปรับชำระล่าช้า</span>
          <span className="text-foreground font-semibold">
            {formatMoney(settings.lateFee)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted flex items-center gap-1.5">
            <Calendar size={13} />
            กำหนดชำระทุกวันที่
          </span>
          <span className="text-foreground font-semibold">
            {settings.dueDay}{" "}
            {settings.dueMonthOffset === 1
              ? "ของเดือนถัดไป"
              : "ของเดือนที่ออกบิล"}
          </span>
        </div>
      </div>
    </div>
  );
};
