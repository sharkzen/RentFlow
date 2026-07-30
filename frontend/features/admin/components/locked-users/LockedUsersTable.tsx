import React from "react";
import { LockedUser } from "@/features/admin";
import { LockKeyholeOpen, ShieldAlert } from "lucide-react";

interface LockedUsersTableProps {
  data: LockedUser[];
  isLoading: boolean;
  now: number;
  onUnlock: (user: LockedUser) => void;
}

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function LockedUsersTable({
  data,
  isLoading,
  now,
  onUnlock,
}: LockedUsersTableProps) {
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
              <th scope="col" className="px-6 py-4 text-center">
                จำนวนครั้งที่ผิด
              </th>
              <th scope="col" className="px-6 py-4 text-center">
                เหลือเวลา
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-border border-border bg-surface divide-y border-t">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <LockKeyholeOpen className="mb-2 h-12 w-12 opacity-20" />
                    <span>ไม่มีบัญชีที่ถูกล็อคในขณะนี้</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((user) => {
                const remainingSeconds = Math.max(
                  0,
                  Math.round(
                    (new Date(user.lockedUntil).getTime() - now) / 1000,
                  ),
                );

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-background/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">
                            {user.email}
                          </div>
                          <div className="text-muted text-xs">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{user.role}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-background text-muted inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-medium">
                        {user.failedLoginAttempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold tracking-wide text-rose-700 tabular-nums">
                        {formatTime(remainingSeconds)}นาที
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onUnlock(user)}
                        className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        ปลดล็อค
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
