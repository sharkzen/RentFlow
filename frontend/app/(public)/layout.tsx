import Footer from "@/lib/ui/layout/Footer";
import LenisProvider from "./LenisProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      {children}
      <Footer />
    </LenisProvider>
  );
}
