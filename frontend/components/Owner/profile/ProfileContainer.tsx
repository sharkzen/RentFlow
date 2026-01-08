import FormProfile from "./FormProfile";

export default function ProfileContainer() {
  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าโปรไฟล์</h1>
        <p className="mt-1 text-sm text-gray-500">
          จัดการข้อมูลส่วนตัวและช่องทางการติดต่อของคุณ
        </p>
      </div>
      <div className="w-full">
        <FormProfile />
      </div>
    </div>
  );
}
