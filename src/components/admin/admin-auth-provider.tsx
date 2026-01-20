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
    // Check localStorage for admin password (key matches admin page)
    const storedPassword = localStorage.getItem("admin-password");

    if (storedPassword) {
      // Verify the password is still valid by making a test request
      fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        body: JSON.stringify({ test: true }),
      })
        .then((res) => {
          if (res.status === 401) {
            // Password is invalid, clear it
            localStorage.removeItem("admin-password");
            setIsAdmin(false);
            setAdminPassword(null);
          } else {
            // Password is valid (even if request fails for other reasons)
            setIsAdmin(true);
            setAdminPassword(storedPassword);
          }
        })
        .catch(() => {
          // Network error, assume password is valid for offline scenarios
          setIsAdmin(true);
          setAdminPassword(storedPassword);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminPassword, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
