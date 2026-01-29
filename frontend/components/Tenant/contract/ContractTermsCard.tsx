import React from "react";
import { FileText, Calendar, Wallet } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/th";

export const ContractTermsCard = ({ tenant }: { tenant: any }) => {
  const formatDate = (date: string) =>
    date ? dayjs(date).locale("th").format("D MMM BBBB") : "-";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="bg-indigo-600 p-4">
        <h3 className="flex items-center gap-2 font-bold text-white">
          <FileText size={18} />
          ข้อมูลสัญญาเช่า
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 text-indigo-500" size={20} />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">
                  ระยะเวลาสัญญา
                </p>
                <p className="font-semibold text-gray-800">
                  {formatDate(tenant.contractStartDate)}-{" "}
                  {formatDate(tenant.contractEndDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 text-emerald-500" size={20} />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">
                  วันที่เข้าอยู่จริง
                </p>
                <p className="font-semibold text-gray-800">
                  {formatDate(tenant.moveInDate)}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl bg-indigo-50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-700">
              <Wallet size={16} />
              สรุปค่าธรรมเนียมแรกเข้า
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">เงินประกัน/มัดจำ</span>
              <span className="font-bold text-gray-800">
                ฿{(tenant?.securityDeposit ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ค่าเช่าล่วงหน้า</span>
              <span className="font-bold text-gray-800">
                ฿{(tenant?.advancePayment ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-2 text-sm">
              <span className="font-bold text-indigo-700">
                ยอดรวมวันทำสัญญา
              </span>
              <span className="font-black text-indigo-700">
                ฿
                {(
                  (tenant?.securityDeposit ?? 0) +
                  (tenant?.advancePayment ?? 0) +
                  (tenant?.entranceFee ?? 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {tenant.notes && (
          <div className="mt-6 rounded-xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="mb-1 text-xs font-bold text-yellow-700 uppercase">
              หมายเหตุเพิ่มเติม
            </p>
            <p className="text-sm text-gray-700">{tenant.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
