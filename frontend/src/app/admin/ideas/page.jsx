"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    Panel,
    PanelHeader,
    PanelBody,
    SearchInput,
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

const Tag = ({ children }) => (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {children}
    </span>
);

const AdminIdeasPage = () => {
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
            const res = await fetch(`${API_URL}${Urls.admin.ideas}?${params.toString()}`, {
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
            console.error("admin.ideas.fetch", err);
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
    const onSearchChange = (value) => { setSearch(value); setPage(1); };

    return (
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.ideas") }]}
                title={t("admin.ideas.title")}
                description={t("admin.users.subtitle", { count: total })}
            />

            <Panel>
                <PanelHeader
                    title={t("admin.ideas.listTitle")}
                    actions={
                        <SearchInput
                            value={search}
                            onChange={onSearchChange}
                            placeholder={t("admin.ideas.searchPlaceholder")}
                            className="w-full md:w-72"
                        />
                    }
                />
                <PanelBody>
                    {loadState === "loading" ? (
                        <LoadingState />
                    ) : loadState === "error" ? (
                        <ErrorState />
                    ) : items.length === 0 ? (
                        <EmptyState label={t("admin.ideas.empty")} />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <TableShell>
                                    <thead>
                                        <tr>
                                            <Th>{t("admin.ideas.table.keyword")}</Th>
                                            <Th>{t("admin.ideas.table.audience")}</Th>
                                            <Th>{t("admin.ideas.table.type")}</Th>
                                            <Th>{t("admin.ideas.table.author")}</Th>
                                            <Th>{t("admin.ideas.table.createdAt")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map((idea) => (
                                            <tr key={idea.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <Td>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{idea.keyword}</p>
                                                </Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{idea.audience || "—"}</Td>
                                                <Td>{idea.type ? <Tag>{idea.type}</Tag> : <span className="text-slate-400">—</span>}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">
                                                    {idea.author ? (
                                                        <div>
                                                            <p className="text-slate-700 dark:text-slate-300">{idea.author.name}</p>
                                                            <p className="text-xs opacity-75 truncate">{idea.author.email}</p>
                                                        </div>
                                                    ) : "—"}
                                                </Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(idea.createdAt, locale)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableShell>
                            </div>

                            <div className="md:hidden space-y-3">
                                {items.map((idea) => (
                                    <div key={idea.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{idea.keyword}</p>
                                            {idea.type && <Tag>{idea.type}</Tag>}
                                        </div>
                                        {idea.audience && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{idea.audience}</p>
                                        )}
                                        {idea.author && (
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {idea.author.name} · {idea.author.email}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-400">
                                            {formatDate(idea.createdAt, locale)}
                                        </p>
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

export default AdminIdeasPage;
