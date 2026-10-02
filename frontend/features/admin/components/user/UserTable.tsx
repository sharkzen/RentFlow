import React from "react";
import {
  AdminUser,
  getUserDisplayName,
  getUserPhone,
} from "@/features/admin";
import { Eye, UserCircle2, Lock } from "lucide-react";
import { formatThaiDate } from "@/lib/dateFormatter";

interface UserTableProps {
  data: AdminUser[];
  isLoading: boolean;
  onViewDetail: (user: AdminUser) => void;
}

export const renderRoleBadge = (role: string) => {
  const isOwner = role === "OWNER";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isOwner ? "bg-indigo-100 text-indigo-700" : "bg-sky-100 text-sky-700"
      }`}
    >
      {isOwner ? "เจ้าของหอ" : role === "TENANT" ? "ลูกบ้าน" : role}
    </span>
  );
};

export const renderStatusBadge = (status: string) => {
  let styles = "bg-background text-muted";

  switch (status) {
    case "ACTIVE":
      styles = "bg-emerald-100 text-emerald-700";
      break;
    case "BANNED":
      styles = "bg-rose-100 text-rose-700";
      break;
    case "PENDING":
      styles = "bg-orange-100 text-orange-700";
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${styles}`}
    >
      {status}
    </span>
  );
};

export default function UserTable({
  data,
  isLoading,
  onViewDetail,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="border-border bg-surface w-full rounded-xl border p-20 text-center shadow-sm">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-blue-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted mt-4">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="text-muted w-full text-left text-sm">
          <thead className="bg-background/50 text-muted text-xs font-semibold tracking-wider uppercase">
            <tr>
              <th scope="col" className="px-6 py-4">
                ผู้ใช้งาน
              </th>
              <th scope="col" className="px-6 py-4 text-center">
                บทบาท
              </th>
              <th scope="col" className="px-6 py-4">
                ข้อมูลติดต่อ
              </th>
              <th scope="col" className="px-6 py-4">
                หอพัก / ห้อง
              </th>
              <th scope="col" className="px-6 py-4 text-center">
                วันที่สมัคร
              </th>
              <th scope="col" className="px-6 py-4 text-center">
                สถานะ
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-border border-border bg-surface divide-y border-t">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserCircle2 className="mb-2 h-12 w-12 opacity-20" />
                    <span>ไม่พบข้อมูลผู้ใช้งาน</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((user) => {
                const name = getUserDisplayName(user);
                const tenant = user.tenantProfiles[0];
                const isLocked =
                  !!user.lockedUntil &&
                  new Date(user.lockedUntil).getTime() > Date.now();

                return (
                  <tr
                    key={user.id}
                    onClick={() => onViewDetail(user)}
                    className="group hover:bg-background/80 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <span className="text-sm font-semibold">
                            {(name[0] || user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-foreground flex items-center gap-1.5 font-semibold transition-colors group-hover:text-blue-600">
                            {name}
                            {isLocked && (
                              <Lock
                                className="h-3.5 w-3.5 text-rose-500"
                                aria-label="บัญชีถูกล็อค"
                              />
                            )}
                          </div>
                          <div className="text-muted text-xs">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{user.email}</span>
                        <span className="text-muted text-xs">
                          {getUserPhone(user)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "OWNER" ? (
                        <span className="text-foreground text-sm">
                          {user.ownerProfile?._count.dormitories ?? 0} หอพัก
                        </span>
                      ) : tenant?.room ? (
                        <div className="flex flex-col">
                          <span className="text-foreground text-sm">
                            {tenant.room.dormitory.name}
                          </span>
                          <span className="text-muted text-xs">
                            ห้อง {tenant.room.roomNumber}
                            {!tenant.isActive && " (ย้ายออกแล้ว)"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-muted px-6 py-4 text-center text-xs">
                      {formatThaiDate(user.createdAt, "compact-datetime")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(user);
                        }}
                        className="text-muted inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-blue-50 hover:text-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
