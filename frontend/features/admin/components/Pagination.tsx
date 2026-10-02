import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="border-border bg-surface flex items-center justify-between rounded-lg border-t px-4 py-3 shadow-sm sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="border-border bg-surface text-foreground hover:bg-background relative inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          ก่อนหน้า
        </button>
        <span className="text-foreground self-center text-sm">
          {page}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="border-border bg-surface text-foreground hover:bg-background relative inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-foreground text-sm">
          แสดง <span className="font-medium">{from}</span> ถึง{" "}
          <span className="font-medium">{to}</span> จากทั้งหมด{" "}
          <span className="font-medium">{total}</span> รายการ
        </p>
        <nav
          className="isolate inline-flex -space-x-px rounded-md shadow-sm"
          aria-label="Pagination"
        >
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="text-muted ring-border hover:bg-background relative inline-flex cursor-pointer items-center rounded-l-md px-2 py-2 ring-1 ring-inset focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="sr-only">ก่อนหน้า</span>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-foreground ring-border relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="text-muted ring-border hover:bg-background relative inline-flex cursor-pointer items-center rounded-r-md px-2 py-2 ring-1 ring-inset focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="sr-only">ถัดไป</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}
