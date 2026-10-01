"use client";
import React, { useEffect, useState } from "react";
import { User, Mail, Phone, Info } from "lucide-react";
import { toast } from "react-toastify";

import { authService } from "@/features/auth/services/auth.service";
import log from "@/lib/logger";
import Skeleton from "@/lib/ui/Skeleton";

type ProfileInfo = {
  fullName: string;
  email: string;
  phone: string;
};

export default function TenantProfileInfo() {
  const [info, setInfo] = useState<ProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await authService.getMe();
        const profile = me.tenantProfiles?.[0];

        if (mounted) {
          setInfo({
            fullName: me.fullName || "",
            email: me.email || profile?.email || "",
            phone: profile?.phone || "",
          });
        }
      } catch (error) {
        log.error("Error fetching tenant profile:", error);
        if (mounted) toast.error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const fields = [
    { label: "ชื่อ-นามสกุล", value: info?.fullName, icon: User },
    { label: "อีเมล", value: info?.email, icon: Mail },
    { label: "เบอร์โทรศัพท์", value: info?.phone, icon: Phone },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          โปรไฟล์
        </h1>
        <p className="text-muted mt-1 text-sm">ข้อมูลส่วนตัวของคุณ</p>
      </div>
      <div className="border-border bg-surface w-full overflow-hidden rounded-xl border">
        <div className="border-border border-b p-4">
          <h3 className="text-foreground text-base font-semibold">
            ข้อมูลส่วนตัว
          </h3>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
            {fields.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <label className="text-foreground mb-1.5 block text-xs font-semibold">
                  {label}
                </label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="relative">
                    <Icon className="text-muted pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <input
                      type="text"
                      value={value || "-"}
                      disabled
                      readOnly
                      className="border-border bg-background text-muted h-10 w-full cursor-default rounded-lg border px-3 pl-10 text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              หากต้องการแก้ไขข้อมูลส่วนตัว กรุณาติดต่อเจ้าของหอพักเพื่อทำการเปลี่ยนแปลง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
