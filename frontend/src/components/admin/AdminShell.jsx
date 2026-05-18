"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    BarChart3,
    Users,
    FileText,
    Lightbulb,
    Mail,
    MapPin,
    Ban,
    Loader2,
    ShieldAlert,
    ArrowLeft,
    Sparkles,
} from "lucide-react";
import { useTranslation } from "@/hooks/useI18n";

const NAV = [
    { href: "/admin", key: "dashboard", icon: BarChart3 },
    { href: "/admin/users", key: "users", icon: Users },
    { href: "/admin/articles", key: "articles", icon: FileText },
    { href: "/admin/ideas", key: "ideas", icon: Lightbulb },
    { href: "/admin/mails", key: "mails", icon: Mail },
    { href: "/admin/login-ips", key: "loginIps", icon: MapPin },
    { href: "/admin/banned-ips", key: "bans", icon: Ban },
];

const isActive = (pathname, href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
};

const TopBar = () => {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-6 h-14">
                <Link href="/admin" className="flex items-center gap-2 shrink-0">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {t("admin.shell.brand")}
                    </span>
                </Link>

                <nav className="flex-1 overflow-x-auto">
                    <ul className="flex min-w-max items-center gap-1">
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(pathname, item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={
                                            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors " +
                                            (active
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                                        }
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden md:inline whitespace-nowrap">
                                            {t(`admin.nav.${item.key}`)}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <Link
                    href="/dashboard"
                    className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 shrink-0"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("admin.shell.backToApp")}
                </Link>
            </div>
        </header>
    );
};

const AccessLoading = () => {
    const { t } = useTranslation();
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("admin.guard.loading")}
        </div>
    );
};

const AccessDenied = () => {
    const { t } = useTranslation();
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-2xl text-slate-900 dark:text-slate-100">{t("admin.guard.title")}</h1>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{t("admin.guard.description")}</p>
        </div>
    );
};

export const AdminShell = ({ children }) => {
    const { data: session, status } = useSession();

    if (status === "loading") return <AccessLoading />;
    if (session?.user?.role !== "admin") return <AccessDenied />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <TopBar />
            <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
                {children}
            </main>
        </div>
    );
};
