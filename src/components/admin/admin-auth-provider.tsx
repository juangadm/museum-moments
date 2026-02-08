"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AdminAuthContextType = {
  isAdmin: boolean;
  adminPassword: string | null;
  isLoading: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  adminPassword: null,
  isLoading: true,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

type AdminAuthProviderProps = {
  children: ReactNode;
};

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const storedPassword = localStorage.getItem("admin-password");

      if (!storedPassword) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/moments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": storedPassword,
          },
          body: JSON.stringify({ test: true }),
        });

        if (res.status === 401) {
          localStorage.removeItem("admin-password");
        } else {
          setIsAdmin(true);
          setAdminPassword(storedPassword);
        }
      } catch {
        // Network error, assume password is valid for offline scenarios
        setIsAdmin(true);
        setAdminPassword(storedPassword);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminPassword, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
