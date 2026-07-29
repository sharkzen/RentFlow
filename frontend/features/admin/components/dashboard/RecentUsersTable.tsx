import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DashboardData } from "@/features/admin";

interface RecentUsersTableProps {
  users: DashboardData["recentUsers"];
}

export const RecentUsersTable = ({ users }: RecentUsersTableProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 ring-purple-500/10";
      case "OWNER":
        return "bg-blue-100 text-blue-700 ring-blue-500/10";
      case "TENANT":
        return "bg-emerald-100 text-emerald-700 ring-emerald-500/10";
      default:
        return "bg-background text-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-emerald-600";
      case "PENDING":
        return "text-orange-500";
      case "BANNED":
        return "text-red-500";
      default:
        return "text-muted";
    }
  };

  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-6 py-5">
        <h3 className="text-foreground font-bold">ผู้ใช้งานล่าสุด</h3>
        <span className="text-muted text-xs">5 รายการล่าสุด</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-background/50 text-muted">
            <tr>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">สิทธิ์ (Role)</th>
              <th className="px-6 py-4 font-medium">สถานะ</th>
              <th className="px-6 py-4 font-medium">วันที่สมัคร</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-background/50 transition-colors"
              >
                <td className="text-foreground px-6 py-4 font-medium">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 font-medium ${getStatusColor(user.status)}`}
                >
                  {user.status}
                </td>
                <td className="text-muted px-6 py-4">
                  {format(new Date(user.createdAt), "d MMM yy HH:mm", {
                    locale: th,
                  })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted px-6 py-8 text-center">
                  ไม่มีข้อมูลผู้ใช้งานล่าสุด
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
