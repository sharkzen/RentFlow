"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2 pb-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-border hover:bg-surface rounded-lg border p-2 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="text-muted h-5 w-5" />
      </button>
      <span className="text-foreground text-sm font-medium">
        หน้า {currentPage}จาก {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-border hover:bg-surface rounded-lg border p-2 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="text-muted h-5 w-5" />
      </button>
    </div>
  );
}
