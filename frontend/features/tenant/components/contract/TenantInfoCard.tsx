import { TenantContractDetail } from "@/features/tenant";
import {
  User,
  Phone,
  Mail,
  Fingerprint,
  Home,
  Users,
  AlertCircle,
  StickyNote,
} from "lucide-react";

const maskIdCard = (idCard?: string | null) => {
  if (!idCard || idCard.length < 5) return idCard || "-";
  return `${idCard.slice(0, 1)}-${"x".repeat(idCard.length - 5)}-${idCard.slice(-4)}`;
};

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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-800">
        <User size={18} className="text-blue-500" />
        ข้อมูลผู้เช่าในสัญญา
      </h3>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
          {tenant.firstName[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">
            {tenant.firstName} {tenant.lastName}
          </p>
          <p className="text-xs text-slate-500">ผู้เช่าหลัก (Primary Tenant)</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
        <div className="flex items-center gap-3 text-slate-600">
          <Phone size={15} className="shrink-0 text-slate-400" />
          <span>{tenant.phone || "-"}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Mail size={15} className="shrink-0 text-slate-400" />
          <span className="truncate">{tenant.email || "-"}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Fingerprint size={15} className="shrink-0 text-slate-400" />
          <span>{maskIdCard(tenant.idCard)}</span>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <Home size={15} className="mt-0.5 shrink-0 text-slate-400" />
          <span>{tenant.address || "-"}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Users size={15} className="shrink-0 text-slate-400" />
          <span>{tenant.numberOfResidents || 1} คน</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase">
          <AlertCircle size={13} />
          ผู้ติดต่อฉุกเฉิน
        </p>
        <p className="text-sm font-semibold text-slate-800">
          {tenant.emergencyContactName || "-"}
        </p>
        <p className="text-sm text-slate-600">
          {tenant.emergencyContactPhone || "-"}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
          ระยะเวลาสัญญา
        </p>
        <div className="mt-1.5 flex flex-col gap-1 text-xs font-medium text-slate-700">
          <div>เข้าพัก: {formatDate(tenant.moveInDate)}</div>
          <div>เริ่มสัญญา: {formatDate(tenant.contractStartDate)}</div>
          <div>
            สิ้นสุดสัญญา:{" "}
            {tenant.contractEndDate
              ? formatDate(tenant.contractEndDate)
              : "ไม่มีกำหนด"}
          </div>
        </div>
      </div>

      {tenant.notes && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <StickyNote size={13} />
            หมายเหตุ
          </p>
          <p className="text-sm text-slate-700">{tenant.notes}</p>
        </div>
      )}
    </div>
  );
};
