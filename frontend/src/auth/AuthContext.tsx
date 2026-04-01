import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getStoredToken, setStoredToken } from "../api/client";
import { loginRequest } from "../api/financeApi";

type AuthUser = { id: string; email: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken();
    if (!t) return null;
    const raw = localStorage.getItem("finance_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    setStoredToken(res.token);
    const u = { id: res.id, email: res.email };
    localStorage.setItem("finance_user", JSON.stringify(u));
    setToken(res.token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem("finance_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
