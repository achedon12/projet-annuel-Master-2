"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { API_URL, Urls } from "@/utils/Api";

const PER_PAGE = 20;

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

const AdminLoginIpsInner = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
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
            const res = await fetch(`${API_URL}${Urls.admin.loginIps}?${params.toString()}`, {
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
            console.error("admin.loginIps.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token, page, search]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchItems();
        }
    }, [sessionStatus, fetchItems]);

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("admin.loginIps.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("admin.loginIps.subtitle")}</p>
                </div>

                <AdminNav />

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>{t("admin.loginIps.listTitle")}</CardTitle>
                                <CardDescription>{t("admin.users.subtitle", { count: total })}</CardDescription>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <Input
                                    placeholder={t("admin.loginIps.searchPlaceholder")}
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="pl-9"
                                />
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
                                {t("admin.loginIps.empty")}
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto rounded-md border dark:border-slate-800">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-2">{t("admin.loginIps.table.ip")}</th>
                                                <th className="px-4 py-2">{t("admin.loginIps.table.user")}</th>
                                                <th className="px-4 py-2">{t("admin.loginIps.table.event")}</th>
                                                <th className="px-4 py-2">{t("admin.loginIps.table.createdAt")}</th>
                                                <th className="px-4 py-2">{t("admin.loginIps.table.lastSeenAt")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-800">
                                            {items.map((login) => (
                                                <tr key={login.id}>
                                                    <td className="px-4 py-3 font-mono text-xs">{login.ipAddress}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {login.user ? (
                                                            <div>
                                                                <p>{login.user.name}</p>
                                                                <p className="text-xs opacity-75">{login.user.email}</p>
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="px-4 py-3"><Badge variant="secondary">{login.event}</Badge></td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(login.createdAt, locale)}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(login.lastSeenAt, locale)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {items.map((login) => (
                                        <div key={login.id} className="rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-mono text-sm">{login.ipAddress}</p>
                                                <Badge variant="secondary">{login.event}</Badge>
                                            </div>
                                            {login.user && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {login.user.name} · {login.user.email}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                {t("admin.loginIps.table.lastSeenAt")} : {formatDate(login.lastSeenAt, locale)}
                                            </p>
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

const AdminLoginIpsPage = () => (
    <AdminGuard>
        <AdminLoginIpsInner />
    </AdminGuard>
);

export default AdminLoginIpsPage;
