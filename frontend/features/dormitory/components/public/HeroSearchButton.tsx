"use client";
import { scroller } from "react-scroll";
import { Search, ArrowDown } from "lucide-react";

export default function HeroSearchButton() {
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
    <button
      onClick={onSearch}
      className="group border-border bg-surface text-foreground relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border px-8 py-4 text-base font-bold shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] active:scale-95"
    >
      <Search className="h-5 w-5 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-500" />
      <span>เริ่มค้นหาห้องพักเลย</span>
      <ArrowDown className="absolute right-6 h-5 w-5 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-y-1 group-hover:opacity-100" />
    </button>
  );
}
