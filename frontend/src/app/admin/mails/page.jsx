"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
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
        return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
};

const AdminMailsPage = () => {
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
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.mails") }]}
                title={t("admin.mails.title")}
                description={t("admin.users.subtitle", { count: total })}
            />

            <Panel>
                <PanelHeader
                    title={t("admin.mails.listTitle")}
                    actions={
                        <>
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
                            <SearchInput
                                value={search}
                                onChange={(v) => { setSearch(v); setPage(1); }}
                                placeholder={t("admin.mails.searchPlaceholder")}
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
                        <EmptyState label={t("admin.mails.empty")} />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <TableShell>
                                    <thead>
                                        <tr>
                                            <Th>{t("admin.mails.table.to")}</Th>
                                            <Th>{t("admin.mails.table.subject")}</Th>
                                            <Th>{t("admin.mails.table.status")}</Th>
                                            <Th>{t("admin.mails.table.attempts")}</Th>
                                            <Th>{t("admin.mails.table.createdAt")}</Th>
                                            <Th>{t("admin.mails.table.sentAt")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map((mail) => (
                                            <tr key={mail.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <Td>
                                                    <p className="font-mono text-xs text-slate-900 dark:text-slate-100">{mail.toEmail}</p>
                                                    {mail.toName && <p className="text-xs text-slate-500 dark:text-slate-400">{mail.toName}</p>}
                                                </Td>
                                                <Td>
                                                    <p className="text-slate-700 dark:text-slate-200 line-clamp-1">{mail.subject}</p>
                                                </Td>
                                                <Td>
                                                    <StatusPill status={mail.status}>{statusLabel(mail.status)}</StatusPill>
                                                </Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{mail.attempts}/{mail.maxAttempts}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(mail.createdAt, locale)}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(mail.sentAt, locale)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableShell>
                            </div>

                            <div className="md:hidden space-y-3">
                                {items.map((mail) => (
                                    <div key={mail.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium truncate text-slate-900 dark:text-slate-100">{mail.subject}</p>
                                            <StatusPill status={mail.status}>{statusLabel(mail.status)}</StatusPill>
                                        </div>
                                        <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{mail.toEmail}</p>
                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{t("admin.mails.table.attempts")} : {mail.attempts}/{mail.maxAttempts}</span>
                                            <span>{formatDate(mail.createdAt, locale)}</span>
                                        </div>
                                        {mail.lastError && (
                                            <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600 break-words dark:bg-red-950/30 dark:text-red-400">
                                                {mail.lastError}
                                            </p>
                                        )}
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

export default AdminMailsPage;
