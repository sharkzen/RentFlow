"use client";
import Link from "next/link";
import { scroller } from "react-scroll";
import { Search, Building2, ArrowRight, ArrowDown } from "lucide-react";

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
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <div className="absolute inset-0 -z-10 select-none">
        <img
          src="https://media.architecturaldigest.com/photos/6536908417f79b79b74fb1ff/16:9/w_2560%2Cc_limit/anand-loft-bedroom.jpg"
          alt="Modern Cozy Apartment"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-slate-950/90" />
      </div>
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-10 w-full px-6 py-12 md:px-12 lg:px-20"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-200 backdrop-blur-sm">
            ✨ แพลตฟอร์มหาหอพักยุคใหม่ ครบ จบ ในที่เดียว
          </span>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl">
            Rent
            <span className="ml-3 bg-linear-to-br from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>
          <h2 className="mb-8 text-2xl leading-relaxed font-medium text-slate-200 md:text-3xl lg:text-4xl">
            ค้นหาหอพักที่ใช่{" "}
            <span className="relative font-semibold whitespace-nowrap text-white">
              <span
                className="absolute -inset-1 block -skew-y-1 bg-blue-600/20 backdrop-blur-sm"
                aria-hidden="true"
              />
              <span className="relative">ในสไตล์ที่เป็นคุณ</span>
            </span>
          </h2>
          <p className="mb-10 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            แพลตฟอร์มครบวงจรสำหรับหอพัก — ผู้เช่าค้นหาห้องสวยได้ง่าย ๆ
            <br className="hidden md:block" />
            เจ้าของหอจัดการประกาศและรายได้สะดวกในที่เดียว
          </p>
          <div className="w-full max-w-md">
            <button
              onClick={onSearch}
              className="group relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] active:scale-95"
            >
              <Search className="h-5 w-5 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-500" />
              <span>เริ่มค้นหาห้องพักเลย</span>
              <ArrowDown className="absolute right-6 h-5 w-5 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-y-1 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
