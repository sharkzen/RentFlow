import HeroSearchButton from "./HeroSearchButton";

export default function Hero() {
  return (
    <section
      suppressHydrationWarning
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
    >
      <div className="bg-grid bg-grid-fade absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-100 w-100 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--glow-primary)" }}
      />
      <div
        aria-hidden="true"
        className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--glow-secondary)" }}
      />
      <div
        suppressHydrationWarning
        data-aos="fade-up"
        className="relative z-10 w-full px-6 py-12 md:px-12 lg:px-20"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="text-foreground mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl">
            Rent
            <span className="ml-3 bg-linear-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>
          <h2 className="text-foreground mb-8 text-2xl leading-relaxed font-medium opacity-80 md:text-3xl lg:text-4xl">
            ค้นหาหอพักที่ใช่{" "}
            <span className="text-foreground relative font-semibold whitespace-nowrap">
              <span
                className="absolute -inset-1 block -skew-y-1 bg-blue-500/10 backdrop-blur-sm"
                aria-hidden="true"
              />
              <span className="relative">ในสไตล์ที่เป็นคุณ</span>
            </span>
          </h2>
          <p className="text-muted mb-10 max-w-2xl text-base leading-7 md:text-lg">
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
