import { TenantContractDetail } from "@/features/tenant";
import { User, Phone, Mail, Fingerprint } from "lucide-react";

export const TenantInfoCard = ({
  tenant,
}: {
  tenant: TenantContractDetail;
}) => {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
        <User size={20} className="text-blue-500" />
        ข้อมูลผู้เช่าในสัญญา
      </h3>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full w-full items-center justify-center bg-blue-100 font-bold text-blue-600">
              {tenant.firstName[0]}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {tenant.firstName} {tenant.lastName}
            </p>
            <p className="text-xs text-slate-500">
              ผู้เช่าหลัก (Primary Tenant)
            </p>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Phone size={16} className="text-slate-400" />
            <span>{tenant.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail size={16} className="text-slate-400" />
            <span className="truncate">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Fingerprint size={16} className="text-slate-400" />
            <span>เลขบัตร: {tenant.idCard.replace(/.(?=.{4})/g, "*")}</span>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">
            Contract Duration
          </p>
          <div className="mt-1 flex items-center justify-between text-xs font-medium">
            <div className="text-slate-700">
              เริ่ม: {formatDate(tenant.contractStartDate)}
            </div>
            <div className="text-slate-300">|</div>
            <div className="text-slate-700">
              สิ้นสุด:{" "}
              {tenant.contractEndDate
                ? formatDate(tenant.contractEndDate)
                : "ไม่มีกำหนด"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
