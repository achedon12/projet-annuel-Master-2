"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { Search, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { API_URL, Urls } from "@/utils/Api";

const PER_PAGE = 20;
const STATUS_VARIANTS = {
    draft: "secondary",
    review: "outline",
    published: "default",
    archived: "secondary",
};

const formatDate = (iso, locale) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
};

const AdminArticlesInner = () => {
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
            const res = await fetch(`${API_URL}${Urls.admin.articles}?${params.toString()}`, {
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
            console.error("admin.articles.fetch", err);
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
    const onSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };
    const onStatusChange = (value) => {
        setStatus(value);
        setPage(1);
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("admin.articles.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("admin.articles.subtitle")}</p>
                </div>

                <AdminNav />

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>{t("admin.articles.listTitle")}</CardTitle>
                                <CardDescription>
                                    {t("admin.users.subtitle", { count: total })}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <Select value={status} onValueChange={onStatusChange}>
                                    <SelectTrigger className="w-full md:w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("admin.articles.statusAll")}</SelectItem>
                                        <SelectItem value="draft">{t("history.status.draft")}</SelectItem>
                                        <SelectItem value="review">{t("history.status.review")}</SelectItem>
                                        <SelectItem value="published">{t("history.status.published")}</SelectItem>
                                        <SelectItem value="archived">{t("history.status.archived")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        placeholder={t("admin.articles.searchPlaceholder")}
                                        value={search}
                                        onChange={(e) => onSearchChange(e.target.value)}
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
                                {t("admin.articles.empty")}
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto rounded-md border dark:border-slate-800">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-2">{t("admin.articles.table.title")}</th>
                                                <th className="px-4 py-2">{t("admin.articles.table.author")}</th>
                                                <th className="px-4 py-2">{t("admin.articles.table.status")}</th>
                                                <th className="px-4 py-2">{t("admin.articles.table.words")}</th>
                                                <th className="px-4 py-2">{t("admin.articles.table.seo")}</th>
                                                <th className="px-4 py-2">{t("admin.articles.table.createdAt")}</th>
                                                <th className="px-4 py-2 text-right">{t("admin.articles.table.actions")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-800">
                                            {items.map((article) => (
                                                <tr key={article.id}>
                                                    <td className="px-4 py-3 font-medium">{article.title}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {article.author ? (
                                                            <div>
                                                                <p>{article.author.name}</p>
                                                                <p className="text-xs opacity-75">{article.author.email}</p>
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={STATUS_VARIANTS[article.status] || "secondary"}>
                                                            {t(`history.status.${article.status}`) === `history.status.${article.status}`
                                                                ? article.status
                                                                : t(`history.status.${article.status}`)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">{article.wordCount ?? "—"}</td>
                                                    <td className="px-4 py-3">{article.seoScore ?? "—"}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {formatDate(article.createdAt, locale)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={`/admin/articles/${article.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {items.map((article) => (
                                        <div key={article.id} className="rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium truncate">{article.title}</p>
                                                <Badge variant={STATUS_VARIANTS[article.status] || "secondary"}>
                                                    {t(`history.status.${article.status}`) === `history.status.${article.status}`
                                                        ? article.status
                                                        : t(`history.status.${article.status}`)}
                                                </Badge>
                                            </div>
                                            {article.author && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {article.author.name} · {article.author.email}
                                                </p>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                                                <span>{t("admin.articles.table.words")} : {article.wordCount ?? "—"}</span>
                                                <span>{t("admin.articles.table.seo")} : {article.seoScore ?? "—"}</span>
                                                <span>{formatDate(article.createdAt, locale)}</span>
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/admin/articles/${article.id}`}>
                                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                                        {t("admin.articles.view")}
                                                    </Link>
                                                </Button>
                                            </div>
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

const AdminArticlesPage = () => (
    <AdminGuard>
        <AdminArticlesInner />
    </AdminGuard>
);

export default AdminArticlesPage;
