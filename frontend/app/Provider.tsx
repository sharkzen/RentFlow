"use client";
import { ReactNode, useEffect } from "react";
import { Bounce, ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import AOS from "aos";
import "aos/dist/aos.css";

interface ProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

export default function ProviderRoot({ children }: ProviderProps) {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
          toastClassName="toast-custom"
        />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
