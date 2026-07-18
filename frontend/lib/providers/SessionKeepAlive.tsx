"use client";
import { useEffect } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { usePathname } from "next/navigation";
const PUBLIC_ROUTES = ["/", "/dorms", "/auth"];

export default function SessionKeepAlive() {
  const pathname = usePathname();

  useEffect(() => {
    let lastRefresh = 0;
    const isPublicRoute = PUBLIC_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/"),
    );

    if (isPublicRoute) return;

    const refresh = async () => {
      const now = Date.now();

      if (now - lastRefresh < 30_000) return;

      lastRefresh = now;

      try {
        await authService.refresh();
      } catch {}
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  return null;
}
