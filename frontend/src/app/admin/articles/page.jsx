"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    Panel,
    PanelHeader,
    PanelBody,
    SearchInput,
    StatusPill,
    LoadingState,
    ErrorState,
    EmptyState,
    Pagination,
    TableShell,
    Th,
    Td,
} from "@/components/admin/AdminUI";
import { API_URL, Urls } from "@/utils/Api";

const PER_PAGE = 20;

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

const AdminArticlesPage = () => {
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
    const onSearchChange = (value) => { setSearch(value); setPage(1); };
    const onStatusChange = (value) => { setStatus(value); setPage(1); };

    const statusLabel = (s) => {
        const key = `history.status.${s}`;
        const v = t(key);
        return v === key ? s : v;
    };

    return (
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.articles") }]}
                title={t("admin.articles.title")}
                description={t("admin.users.subtitle", { count: total })}
            />

            <Panel>
                <PanelHeader
                    title={t("admin.articles.listTitle")}
                    actions={
                        <>
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
                            <SearchInput
                                value={search}
                                onChange={onSearchChange}
                                placeholder={t("admin.articles.searchPlaceholder")}
                                className="w-full md:w-72"
                            />
                        </>
                    }
                />
                <PanelBody>
                    {loadState === "loading" ? (
                        <LoadingState />
                    ) : loadState === "error" ? (
                        <ErrorState />
                    ) : items.length === 0 ? (
                        <EmptyState label={t("admin.articles.empty")} />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <TableShell>
                                    <thead>
                                        <tr>
                                            <Th>{t("admin.articles.table.title")}</Th>
                                            <Th>{t("admin.articles.table.author")}</Th>
                                            <Th>{t("admin.articles.table.status")}</Th>
                                            <Th>{t("admin.articles.table.words")}</Th>
                                            <Th>{t("admin.articles.table.seo")}</Th>
                                            <Th>{t("admin.articles.table.createdAt")}</Th>
                                            <Th className="text-right">{t("admin.articles.table.actions")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map((article) => (
                                            <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <Td>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{article.title}</p>
                                                </Td>
                                                <Td className="text-slate-500 dark:text-slate-400">
                                                    {article.author ? (
                                                        <div>
                                                            <p className="text-slate-700 dark:text-slate-300">{article.author.name}</p>
                                                            <p className="text-xs opacity-75 truncate">{article.author.email}</p>
                                                        </div>
                                                    ) : "—"}
                                                </Td>
                                                <Td>
                                                    <StatusPill status={article.status}>{statusLabel(article.status)}</StatusPill>
                                                </Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{article.wordCount ?? "—"}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{article.seoScore ?? "—"}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(article.createdAt, locale)}</Td>
                                                <Td className="text-right">
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={`/admin/articles/${article.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableShell>
                            </div>

                            <div className="md:hidden space-y-3">
                                {items.map((article) => (
                                    <div key={article.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium truncate text-slate-900 dark:text-slate-100">{article.title}</p>
                                            <StatusPill status={article.status}>{statusLabel(article.status)}</StatusPill>
                                        </div>
                                        {article.author && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {article.author.name} · {article.author.email}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
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

                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </PanelBody>
            </Panel>
        </>
    );
};

export default AdminArticlesPage;
