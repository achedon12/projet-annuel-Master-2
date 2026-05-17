'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useI18n";

const ClientLayoutContent = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { loading: languageLoading } = useLanguage();
    const { status } = useSession();
    const { t } = useTranslation();

    const authLoading = status === "loading";
    const isAuthenticated = status === "authenticated";

    useEffect(() => {
        if (authLoading || languageLoading) return;
        if (isAuthenticated && pathname === "/auth") {
            router.push("/dashboard");
        }
    }, [isAuthenticated, pathname, authLoading, languageLoading, router]);

    if (authLoading || languageLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-white text-sm">{t('common.loading')}</p>
                </div>
            </div>
        );
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
