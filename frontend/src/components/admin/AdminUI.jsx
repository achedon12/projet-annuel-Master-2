"use client";

import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTranslation } from "@/hooks/useI18n";

const STATUS_PILLS = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    review: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    archived: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    active: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    expired: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    permanent: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const StatusPill = ({ status, children }) => {
    const cls = STATUS_PILLS[status] || STATUS_PILLS.default;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {children}
        </span>
    );
};

export const Panel = ({ children, className = "" }) => (
    <section
        className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
        {children}
    </section>
);

export const PanelHeader = ({ title, hint, actions, children }) => (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
            {children}
        </div>
        {actions && <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">{actions}</div>}
    </div>
);

export const PanelBody = ({ children, className = "" }) => (
    <div className={`p-5 ${className}`}>{children}</div>
);

export const LoadingState = ({ label }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center py-12 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {label || t("admin.toast.loading")}
        </div>
    );
};

export const ErrorState = ({ label }) => {
    const { t } = useTranslation();
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {label || t("admin.toast.loadError")}
        </div>
    );
};

export const EmptyState = ({ label }) => (
    <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {label}
    </div>
);

export const SearchInput = ({ value, onChange, placeholder, className = "" }) => (
    <div className={`relative ${className}`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
        />
    </div>
);

export const Pagination = ({ page, totalPages, onChange }) => {
    const { t } = useTranslation();
    if (totalPages <= 1) return null;
    return (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("admin.users.pagination", { page, totalPages })}
            </span>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t("admin.users.prev")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                >
                    {t("admin.users.next")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const TableShell = ({ children }) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">{children}</table>
    </div>
);

export const Th = ({ children, className = "" }) => (
    <th
        className={`bg-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 ${className}`}
    >
        {children}
    </th>
);

export const Td = ({ children, className = "" }) => (
    <td className={`px-4 py-3 align-middle text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>
);
