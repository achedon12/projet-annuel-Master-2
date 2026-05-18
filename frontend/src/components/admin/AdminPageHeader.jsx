"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useI18n";

export const AdminPageHeader = ({ breadcrumb = [], title, description, actions }) => {
    const { t } = useTranslation();

    const items = [
        { label: t("admin.shell.brand"), href: "/admin" },
        ...breadcrumb,
    ];

    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2 min-w-0">
                <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    {items.map((item, idx) => {
                        const isLast = idx === items.length - 1;
                        return (
                            <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
                                {item.href && !isLast ? (
                                    <Link
                                        href={item.href}
                                        className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className={isLast ? "text-slate-900 dark:text-slate-200" : ""}>
                                        {item.label}
                                    </span>
                                )}
                                {!isLast && <ChevronRight className="h-3 w-3 opacity-60" />}
                            </span>
                        );
                    })}
                </nav>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">{description}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
};
