import Image from "next/image";
import HeroSearchButton from "./HeroSearchButton";

export default function Hero() {
  return (
    <section
      suppressHydrationWarning
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <div className="absolute inset-0 -z-10 select-none">
        <Image
          src="/hero.jpg"
          alt="Modern Cozy Apartment"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={70}
          className="object-cover opacity-50"
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
            เจ้าของหอจัดการประกาศและลูกบ้านชำระเงินได้สะดวกในที่เดียว
          </p>
          <div className="w-full max-w-md">
            <HeroSearchButton />
          </div>
        </div>
      </div>
    </section>
  );
}
