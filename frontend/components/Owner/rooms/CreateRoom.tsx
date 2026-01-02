import { Plus } from "lucide-react";
import React from "react";

interface CreateRoomProps {
  onClick?: () => void;
}

export default function CreateRoom({ onClick }: CreateRoomProps) {
  return (
    <div className="my-2 flex justify-end">
      <button
        onClick={onClick}
        className="flex cursor-pointer items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-lg active:scale-95"
      >
        <Plus className="h-5 w-5 transition-transform duration-300" />
        <span>สร้างห้องพัก</span>
      </button>
    </div>
  );
}
