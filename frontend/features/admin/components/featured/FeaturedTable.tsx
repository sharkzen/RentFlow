"use client";
import React from "react";
import { Building2, MapPin, Star } from "lucide-react";
import { Dormitory } from "@/features/admin/types";

interface FeaturedTableProps {
  data: Dormitory[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onToggleFeatured: (dorm: Dormitory) => void;
}

export function FeaturedTable({
  data,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onToggleFeatured,
}: FeaturedTableProps) {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-border bg-background text-muted border-b font-medium">
            <tr>
              <th className="px-6 py-4">หอพัก</th>
              <th className="px-6 py-4">เจ้าของ</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
              <th className="px-6 py-4 text-center">แนะนำ</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-muted p-8 text-center">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted p-8 text-center">
                  ไม่พบหอพักที่ตรงกับเงื่อนไข
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-background h-12 w-16 shrink-0 overflow-hidden rounded-lg border">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={
                              item.images[0].objectKey.startsWith("http")
                                ? item.images[0].objectKey
                                : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${item.images[0].objectKey}`
                            }
                            className="h-full w-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="text-muted flex h-full items-center justify-center">
                            <Building2 size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-foreground line-clamp-1 font-semibold">
                          {item.name}
                        </p>
                        <p className="text-muted line-clamp-1 flex items-center gap-1 text-xs">
                          <MapPin size={10} /> {item.address}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-foreground font-medium">
                        {item.owner.fullName}
                      </p>
                      <p className="text-muted text-xs">
                        {item.owner.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-background text-muted rounded-full px-2.5 py-1 text-xs font-bold">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onToggleFeatured(item)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${item.isFeatured ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-background text-muted hover:bg-border"}`}
                    >
                      <Star
                        size={12}
                        fill={item.isFeatured ? "currentColor" : "none"}
                      />
                      {item.isFeatured ? "แนะนำอยู่" : "ปักหมุดแนะนำ"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-border bg-background flex items-center justify-between border-t px-6 py-4">
        <p className="text-muted text-sm">
          แสดง {data.length > 0 ? (page - 1) * 10 + 1 : 0}ถึง{" "}
          {Math.min(page * 10, totalItems)}จาก {totalItems}รายการ
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="border-muted bg-surface hover:bg-background rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="border-muted bg-surface hover:bg-background rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
