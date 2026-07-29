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
    <div className="bg-surface ring-border rounded-2xl p-6 shadow-sm ring-1">
      <h3 className="text-foreground mb-5 flex items-center gap-2 text-sm font-bold">
        <User size={18} className="text-blue-500" />
        ข้อมูลผู้เช่าในสัญญา
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
          {tenant.firstName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-foreground truncate font-bold">
            {tenant.firstName} {tenant.lastName}
          </p>
          <p className="text-muted text-xs">ผู้เช่าหลัก (Primary Tenant)</p>
        </div>
      </div>
      <div className="border-border text-muted mt-5 space-y-3 border-t pt-5 text-sm">
        <div className="flex items-center gap-3">
          <Phone size={15} className="shrink-0" />
          <span>{tenant.phone || "-"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Mail size={15} className="shrink-0" />
          <span className="truncate">{tenant.email || "-"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Fingerprint size={15} className="shrink-0" />
          <span>{maskIdCard(tenant.idCard)}</span>
        </div>
        <div className="flex items-start gap-3">
          <Home size={15} className="mt-0.5 shrink-0" />
          <span>{tenant.address || "-"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Users size={15} className="shrink-0" />
          <span>{tenant.numberOfResidents || 1}คน</span>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase">
          <AlertCircle size={13} />
          ผู้ติดต่อฉุกเฉิน
        </p>
        <p className="text-foreground text-sm font-semibold">
          {tenant.emergencyContactName || "-"}
        </p>
        <p className="text-muted text-sm">
          {tenant.emergencyContactPhone || "-"}
        </p>
      </div>
      <div className="border-border bg-background mt-5 rounded-xl border p-4">
        <p className="text-muted text-[10px] font-bold tracking-wide uppercase">
          ระยะเวลาสัญญา
        </p>
        <div className="text-foreground mt-1.5 flex flex-col gap-1 text-xs font-medium">
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
        <div className="border-border bg-background mt-5 rounded-xl border p-4">
          <p className="text-muted mb-1 flex items-center gap-1.5 text-xs font-bold uppercase">
            <StickyNote size={13} />
            หมายเหตุ
          </p>
          <p className="text-foreground text-sm">{tenant.notes}</p>
        </div>
      )}
    </div>
  );
};
