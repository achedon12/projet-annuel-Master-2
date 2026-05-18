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
        return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
};

const EventTag = ({ event }) => (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
        {event}
    </span>
);

const AdminLoginIpsPage = () => {
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
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.loginIps") }]}
                title={t("admin.loginIps.title")}
                description={t("admin.users.subtitle", { count: total })}
            />

            <Panel>
                <PanelHeader
                    title={t("admin.loginIps.listTitle")}
                    actions={
                        <SearchInput
                            value={search}
                            onChange={(v) => { setSearch(v); setPage(1); }}
                            placeholder={t("admin.loginIps.searchPlaceholder")}
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
                        <EmptyState label={t("admin.loginIps.empty")} />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <TableShell>
                                    <thead>
                                        <tr>
                                            <Th>{t("admin.loginIps.table.ip")}</Th>
                                            <Th>{t("admin.loginIps.table.user")}</Th>
                                            <Th>{t("admin.loginIps.table.event")}</Th>
                                            <Th>{t("admin.loginIps.table.createdAt")}</Th>
                                            <Th>{t("admin.loginIps.table.lastSeenAt")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map((login) => (
                                            <tr key={login.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <Td className="font-mono text-xs text-slate-900 dark:text-slate-100">{login.ipAddress}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">
                                                    {login.user ? (
                                                        <div>
                                                            <p className="text-slate-700 dark:text-slate-300">{login.user.name}</p>
                                                            <p className="text-xs opacity-75 truncate">{login.user.email}</p>
                                                        </div>
                                                    ) : "—"}
                                                </Td>
                                                <Td><EventTag event={login.event} /></Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(login.createdAt, locale)}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(login.lastSeenAt, locale)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableShell>
                            </div>

                            <div className="md:hidden space-y-3">
                                {items.map((login) => (
                                    <div key={login.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-mono text-sm text-slate-900 dark:text-slate-100">{login.ipAddress}</p>
                                            <EventTag event={login.event} />
                                        </div>
                                        {login.user && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
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

                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </PanelBody>
            </Panel>
        </>
    );
};

export default AdminLoginIpsPage;
