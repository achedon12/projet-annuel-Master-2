"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { API_URL, Urls } from "@/utils/Api";

const PER_PAGE = 20;
const STATUS_VARIANTS = {
    pending: "outline",
    processing: "secondary",
    sent: "default",
    failed: "destructive",
};

const formatDate = (iso, locale) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
};

const AdminMailsInner = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loadState, setLoadState] = useState("loading");

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;

    const fetchItems = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
            if (search.trim() !== "") params.set("search", search.trim());
            if (status !== "all") params.set("status", status);
            const res = await fetch(`${API_URL}${Urls.admin.mails}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setItems(Array.isArray(data.items) ? data.items : []);
            setTotal(typeof data.total === "number" ? data.total : 0);
            setLoadState("ready");
        } catch (err) {
            console.error("admin.mails.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token, page, search, status]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchItems();
        }
    }, [sessionStatus, fetchItems]);

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const statusLabel = (s) => {
        const key = `admin.mails.status${s.charAt(0).toUpperCase() + s.slice(1)}`;
        const v = t(key);
        return v === key ? s : v;
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("admin.mails.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("admin.mails.subtitle")}</p>
                </div>

                <AdminNav />

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>{t("admin.mails.listTitle")}</CardTitle>
                                <CardDescription>{t("admin.users.subtitle", { count: total })}</CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                                    <SelectTrigger className="w-full md:w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("admin.mails.statusAll")}</SelectItem>
                                        <SelectItem value="pending">{t("admin.mails.statusPending")}</SelectItem>
                                        <SelectItem value="processing">{t("admin.mails.statusProcessing")}</SelectItem>
                                        <SelectItem value="sent">{t("admin.mails.statusSent")}</SelectItem>
                                        <SelectItem value="failed">{t("admin.mails.statusFailed")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        placeholder={t("admin.mails.searchPlaceholder")}
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadState === "loading" ? (
                            <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("admin.toast.loading")}
                            </div>
                        ) : loadState === "error" ? (
                            <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                                {t("admin.toast.loadError")}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                {t("admin.mails.empty")}
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto rounded-md border dark:border-slate-800">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-2">{t("admin.mails.table.to")}</th>
                                                <th className="px-4 py-2">{t("admin.mails.table.subject")}</th>
                                                <th className="px-4 py-2">{t("admin.mails.table.status")}</th>
                                                <th className="px-4 py-2">{t("admin.mails.table.attempts")}</th>
                                                <th className="px-4 py-2">{t("admin.mails.table.createdAt")}</th>
                                                <th className="px-4 py-2">{t("admin.mails.table.sentAt")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-800">
                                            {items.map((mail) => (
                                                <tr key={mail.id}>
                                                    <td className="px-4 py-3">
                                                        <p className="font-mono text-xs">{mail.toEmail}</p>
                                                        {mail.toName && <p className="text-xs text-slate-500 dark:text-slate-400">{mail.toName}</p>}
                                                    </td>
                                                    <td className="px-4 py-3">{mail.subject}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={STATUS_VARIANTS[mail.status] || "secondary"}>
                                                            {statusLabel(mail.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {mail.attempts}/{mail.maxAttempts}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(mail.createdAt, locale)}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(mail.sentAt, locale)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {items.map((mail) => (
                                        <div key={mail.id} className="rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium truncate">{mail.subject}</p>
                                                <Badge variant={STATUS_VARIANTS[mail.status] || "secondary"}>
                                                    {statusLabel(mail.status)}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{mail.toEmail}</p>
                                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                                                <span>{t("admin.mails.table.attempts")} : {mail.attempts}/{mail.maxAttempts}</span>
                                                <span>{formatDate(mail.createdAt, locale)}</span>
                                            </div>
                                            {mail.lastError && (
                                                <p className="mt-2 rounded bg-red-50 dark:bg-red-950/30 p-2 text-xs text-red-600 dark:text-red-400 break-words">
                                                    {mail.lastError}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {total > PER_PAGE && (
                            <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>{t("admin.users.pagination", { page, totalPages })}</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        {t("admin.users.prev")}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                        {t("admin.users.next")}
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AdminMailsPage = () => (
    <AdminGuard>
        <AdminMailsInner />
    </AdminGuard>
);

export default AdminMailsPage;
