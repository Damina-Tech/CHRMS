import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getApiErrorMessage } from "@/services/api";

export type ChrmsRole = "ADMIN" | "HOUSING_OFFICER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: ChrmsRole;
  department: string;
  designation: string;
  avatar?: string;
  permissions: string[];
}

/** Result is returned synchronously so callers can show accurate error text in toasts */
export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithSSO: (provider: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "chrms_token";
const USER_KEY = "chrms_user";

function permissionsForRole(role: ChrmsRole): string[] {
  if (role === "ADMIN") return ["*"];
  return [
    "dashboard.view",
    "properties.read",
    "properties.write",
    "tenants.read",
    "tenants.write",
    "rentals.read",
    "rentals.write",
    "sales.read",
    "sales.write",
    "payments.read",
    "payments.write",
    "reports.view",
  ];
}

function mapApiUser(u: {
  id: string;
  email: string;
  fullName: string;
  role: string;
}): User {
  const role = (u.role === "ADMIN" ? "ADMIN" : "HOUSING_OFFICER") as ChrmsRole;
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role,
    department: "Chiro City Administration",
    designation: role === "ADMIN" ? "Administrator" : "Housing Officer",
    permissions: permissionsForRole(role),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const hydrate = useCallback(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (t && raw) {
      try {
        setToken(t);
        setUser(JSON.parse(raw) as User);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    setIsLoading(true);
    setLastError(null);
    try {
      const { data } = await api.post<{
        access_token: string;
        user: { id: string; email: string; fullName: string; role: string };
      }>("/auth/login", { email, password });

      const mapped = mapApiUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(mapped));
      setToken(data.access_token);
      setUser(mapped);
      setIsLoading(false);
      return { ok: true };
    } catch (e) {
      const error = getApiErrorMessage(e);
      setLastError(error);
      setIsLoading(false);
      return { ok: false, error };
    }
  };

  const loginWithSSO = async (_provider: string): Promise<LoginResult> => {
    const error = "SSO is not configured for CHRMS. Use email and password.";
    setLastError(error);
    return { ok: false, error };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes("*")) return true;
    return user.permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithSSO,
    logout,
    isAuthenticated: !!user && !!token,
    hasPermission,
    isLoading,
    lastError,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
