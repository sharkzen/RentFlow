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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
