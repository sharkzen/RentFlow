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
        return "bg-gray-100 text-gray-700";
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
        return "text-gray-400";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
        <h3 className="font-bold text-gray-800">ผู้ใช้งานล่าสุด</h3>
        <span className="text-xs text-gray-400">5 รายการล่าสุด</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">สิทธิ์ (Role)</th>
              <th className="px-6 py-4 font-medium">สถานะ</th>
              <th className="px-6 py-4 font-medium">วันที่สมัคร</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-6 py-4 font-medium text-gray-700">
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
                <td className="px-6 py-4 text-gray-500">
                  {format(new Date(user.createdAt), "d MMM yy HH:mm", {
                    locale: th,
                  })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
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
