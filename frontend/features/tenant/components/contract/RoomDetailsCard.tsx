export const RoomDetailsCard = ({ room }: { room: any }) => {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="bg-emerald-600 p-4">
        <h3 className="flex items-center gap-2 font-bold text-white">
          รายละเอียดห้องพัก
        </h3>
      </div>
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              หมายเลขห้อง
            </p>
            <p className="text-2xl font-black text-gray-800">
              {room?.roomNumber || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              ชั้น
            </p>
            <p className="text-2xl font-black text-gray-800">
              {room?.floor ?? "-"}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-dashed p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <span>ค่าเช่าห้อง</span>
            </div>
            <span className="font-bold text-gray-800">
              ฿{(room?.basePrice ?? 0).toLocaleString()}/เดือน
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-dashed p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <span>ค่าน้ำ (หน่วยละ)</span>
            </div>
            <span className="font-bold text-gray-800">
              ฿{room?.dormitory?.settings?.waterRate ?? "-"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-dashed p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <span>ค่าไฟ (หน่วยละ)</span>
            </div>
            <span className="font-bold text-gray-800">
              ฿{room?.dormitory?.settings?.electricRate ?? "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
