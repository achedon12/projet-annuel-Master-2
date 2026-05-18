"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, FileText, Lightbulb, Mail, MapPin, Ban } from "lucide-react";
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

export const AdminNav = () => {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <nav className="-mx-2 mb-6 overflow-x-auto">
            <ul className="flex min-w-max gap-1 px-2">
                {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={
                                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors " +
                                    (active
                                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                                }
                            >
                                <Icon className="h-4 w-4" />
                                <span className="whitespace-nowrap">{t(`admin.nav.${item.key}`)}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
