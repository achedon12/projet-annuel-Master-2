'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import {useTranslation} from "@/hooks/useI18n";

const PROTECTED_ROUTES = ["/dashboard", "/history", "/ideas", "/settings", "/editor"];
const PUBLIC_ROUTES = ["/auth", "/"];

const ClientLayoutContent = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { loading: languageLoading } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsAuthenticated(!!token);
            setIsAuthLoading(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthLoading || languageLoading) return;

        const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (isProtectedRoute && !isAuthenticated) {
            router.push("/auth");
        } else if (isPublicRoute && isAuthenticated && pathname !== "/") {
            if (pathname === "/auth") {
                router.push("/dashboard");
            }
        }
    }, [isAuthenticated, pathname, isAuthLoading, languageLoading, router]);

    if (isAuthLoading || languageLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-white text-sm">{ t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
    if (isProtectedRoute && !isAuthenticated) {
        return null;
    }

    return <LayoutWrapper>{children}</LayoutWrapper>;
};

export const ClientLayout = ({ children }) => {
    return (
        <LanguageProvider>
            <ClientLayoutContent>{children}</ClientLayoutContent>
        </LanguageProvider>
    );
};