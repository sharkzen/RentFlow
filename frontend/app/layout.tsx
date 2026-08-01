import ProviderRoot from "./Provider";
import Header from "@/lib/ui/layout/Header";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import SessionKeepAlive from "@/lib/providers/SessionKeepAlive";

const ibmPlexThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "RentFlow — ค้นหาและจัดการหอพักครบวงจร",
    template: "%s | RentFlow",
  },

  description:
    "RentFlow แพลตฟอร์มค้นหาหอพักและจัดการหอพักครบวงจร ผู้เช่าค้นหาห้องพักได้ง่าย เจ้าของหอจัดการประกาศ บิล และผู้เช่าได้สะดวกในที่เดียว",

  openGraph: {
    type: "website",
    siteName: "RentFlow",
    title: "RentFlow",
    description:
      "ระบบจัดการหอพักครบวงจร จัดการห้องพัก ค่าไฟ ค่าน้ำ บิล และผู้เช่าได้ในที่เดียว",
    url: "https://rentflow.duckdns.org",
    locale: "th_TH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RentFlow",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "RentFlow",
    description: "ระบบจัดการหอพักครบวงจร",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUser();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${ibmPlexThai.className} bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <SessionKeepAlive />
        <AuthProvider initialUser={initialUser}>
          <ProviderRoot>
            <Header />
            {children}
          </ProviderRoot>
        </AuthProvider>
      </body>
    </html>
  );
}
