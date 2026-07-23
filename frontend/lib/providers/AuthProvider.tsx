"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { User } from "@/features/auth";
import { authService } from "@/features/auth/services/auth.service";
import { usePathname } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
});

const PUBLIC_ROUTES = ["/auth/login", "/auth/register"];

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Already resolved server-side (even if null) — trust it, skip the
    // client round-trip so anonymous visitors don't fire a failing
    // /api/auth/me request (and console error) on every page load.
    if (initialUser !== undefined) {
      setLoading(false);
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );

    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      setLoading(true);

      try {
        const res = await authService.getMe();
        setUser(res);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [pathname, initialUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
