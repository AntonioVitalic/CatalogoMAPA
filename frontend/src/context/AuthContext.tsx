import { createContext, useEffect, useState, ReactNode } from "react";
import api from "@/services/api";

type Role = "admin" | "editor" | "visitor";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: Role | null;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  isAuthenticated: false,
  refreshProfile: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshProfile = async () => {
    try {
      const { data } = await api.get<User>("/accounts/me/");
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      setLoading(false);
      return;
    }
    // Intentar cargar “me”
    (async () => {
      await refreshProfile();
      setLoading(false);
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/auth"; // <-- recarga en /auth al cerrar sesión
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role || null,
        isAuthenticated,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
