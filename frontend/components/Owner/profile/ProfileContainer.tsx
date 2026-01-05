import React from "react";
import FormProfile from "./FormProfile";

export default function ProfileContainer() {
  return (
    <div className="flex w-full flex-col p-4">
      <div>
        <h1 className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text py-3 text-4xl font-bold text-transparent">
          ตั้งค่าโปรไฟล์
        </h1>
      </div>
      <div>
        <FormProfile />
      </div>
    </div>
  );
}
