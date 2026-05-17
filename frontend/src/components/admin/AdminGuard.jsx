"use client";

import { useSession } from "next-auth/react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/hooks/useI18n";

/**
 * Wrapper qui n'affiche ses enfants que si le user courant a le rôle admin.
 * Affiche un loader pendant la résolution de la session, puis un écran
 * « accès refusé » si le rôle est insuffisant. Les routes /admin sont déjà
 * gated par proxy.js pour l'authentification ; ce composant ajoute le contrôle
 * de rôle côté front, doublé côté back (403 sur /api/admin/*).
 */
export const AdminGuard = ({ children }) => {
    const { t } = useTranslation();
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("admin.guard.loading")}
            </div>
        );
    }

    if (session?.user?.role !== "admin") {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 px-6 text-center">
                <ShieldAlert className="h-12 w-12 text-red-500" />
                <h1 className="text-2xl text-slate-900 dark:text-slate-100">{t("admin.guard.title")}</h1>
                <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{t("admin.guard.description")}</p>
            </div>
        );
    }

    return children;
};
