"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";

const PROTECTED_ROUTES = ["/dashboard", "/history", "/ideas", "/settings", "/editor"];
const PUBLIC_ROUTES = ["/auth", "/"];

export const ClientLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isProtectedRoute && !isAuthenticated) {
      router.push("/auth");
    } else if (isPublicRoute && isAuthenticated && pathname !== "/") {
      if (pathname === "/auth") {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, pathname, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-white text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (PROTECTED_ROUTES.includes(pathname) && !isAuthenticated) {
    return null;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
}

