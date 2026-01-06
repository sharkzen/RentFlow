"use client";
import { useEffect } from "react";
import { axios } from "@/lib/api-client";

export default function SessionKeepAlive() {
  useEffect(() => {
    let lastRefresh = 0;

    const refresh = async () => {
      const now = Date.now();

      if (now - lastRefresh < 30_000) return;

      lastRefresh = now;

      try {
        await axios.post("/api/auth/refresh");
      } catch {
        window.location.href = "/auth/login";
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    });

    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return null;
}
