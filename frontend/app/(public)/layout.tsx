import LenisProvider from "./LenisProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LenisProvider>{children}</LenisProvider>;
}
