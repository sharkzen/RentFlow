"use client";
import Link from "next/link";
import { off } from "process";
import { scroller } from "react-scroll";

export default function Hero() {
  const onSearch = () => {
    setTimeout(() => {
      scroller.scrollTo("dorm-filter", {
        duration: 800,
        delay: 100,
        smooth: "easeInOutQuart",
        offset: -70,
      });
    });
  };

  return (
    <section
      suppressHydrationWarning
      data-aos="fade-up"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <img
          src="https://media.architecturaldigest.com/photos/6536908417f79b79b74fb1ff/16:9/w_2560%2Cc_limit/anand-loft-bedroom.jpg"
          alt="Cozy Modern Apartment Bedroom with Natural Light and Plants"
          className="h-full w-full object-cover opacity-75"
          loading="eager"
        />

        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent md:via-black/20" />
      </div>

      <div className="relative z-10 w-full px-6 text-center md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center space-y-10 text-white md:space-y-14">
            <h1 className="flex flex-wrap justify-center gap-4 text-5xl font-extrabold drop-shadow-xl md:text-6xl lg:text-7xl">
              Rent{" "}
              <span className="bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Flow
              </span>
            </h1>

            <h2 className="text-3xl leading-tight font-extrabold drop-shadow-lg md:text-5xl lg:text-6xl">
              ค้นหาหอพักที่ใช่ <br className="md:hidden" />
              <span className="block text-white/95 md:inline">
                ในสไตล์ที่เป็นคุณ
              </span>
            </h2>

            <p className="max-w-2xl text-white md:text-xl lg:text-2xl">
              แพลตฟอร์มครบวงจรสำหรับหอพัก — ผู้เช่าค้นหาห้องสวยได้ง่าย ๆ
              เจ้าของหอสมัครสร้างประกาศ จัดการห้องพัก รายได้
              และลูกบ้านได้สะดวกในที่เดียว
            </p>

            <div className="flex flex-wrap justify-center gap-6 p-5">
              <Link href="/owner/dashboard">
                <button className="cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 p-5 font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cyan-500/60 active:scale-95">
                  สร้างหอพักของคุณ (สำหรับเจ้าของ)
                </button>
              </Link>
              <button
                onClick={onSearch}
                className="cursor-pointer rounded-2xl border-2 border-white/70 bg-white/15 p-5 font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/25 active:scale-95"
              >
                ค้นหาห้องพัก
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
