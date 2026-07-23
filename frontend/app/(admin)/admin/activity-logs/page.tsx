import AuditLogContainer from "@/features/admin/components/audit-log/AuditLogContainer";
import React from "react";

export const metadata = {
  title: "ประวัติกิจกรรม (Audit Log)",
};

export default function page() {
  return (
    <>
      <AuditLogContainer />
    </>
  );
}
