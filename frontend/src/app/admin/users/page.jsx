"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/AlertDialog";
import { Trash2, Loader2, Pencil } from "lucide-react";
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

const initialsOf = (name) =>
    (name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("") || "?";

const RoleBadge = ({ role }) => {
    const cls =
        role === "admin"
            ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {role}
        </span>
    );
};

const AdminUsersPage = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loadState, setLoadState] = useState("loading");
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;
    const currentUserId = session?.user?.id ? Number(session.user.id) : null;

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const params = new URLSearchParams({
                page: String(page),
                perPage: String(PER_PAGE),
            });
            if (search.trim() !== "") params.set("search", search.trim());
            const res = await fetch(`${API_URL}${Urls.admin.users}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setUsers(Array.isArray(data.items) ? data.items : []);
            setTotal(typeof data.total === "number" ? data.total : 0);
            setLoadState("ready");
        } catch (err) {
            console.error("admin.users.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token, page, search]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchUsers();
        }
    }, [sessionStatus, fetchUsers]);

    const handleDelete = async () => {
        if (!pendingDeleteId || !token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.admin.user(pendingDeleteId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                let message = t("admin.users.deleteError");
                try {
                    const data = await res.json();
                    if (data?.error) message = data.error;
                } catch {
                    /* body non JSON, fallback */
                }
                toast.error(message);
                return;
            }
            setUsers((prev) => prev.filter((u) => u.id !== pendingDeleteId));
            setTotal((prev) => Math.max(0, prev - 1));
            toast.success(t("admin.users.deleteSuccess"));
        } catch (err) {
            console.error("admin.users.delete", err);
            toast.error(t("admin.users.deleteError"));
        } finally {
            setIsDeleting(false);
            setPendingDeleteId(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.users") }]}
                title={t("admin.users.title")}
                description={t("admin.users.subtitle", { count: total })}
            />

            <Panel>
                <PanelHeader
                    title={t("admin.users.listTitle")}
                    hint={t("admin.users.listHint")}
                    actions={
                        <SearchInput
                            value={search}
                            onChange={handleSearchChange}
                            placeholder={t("admin.users.searchPlaceholder")}
                            className="w-full md:w-72"
                        />
                    }
                />
                <PanelBody>
                    {loadState === "loading" ? (
                        <LoadingState />
                    ) : loadState === "error" ? (
                        <ErrorState />
                    ) : users.length === 0 ? (
                        <EmptyState label={t("admin.users.empty")} />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <TableShell>
                                    <thead>
                                        <tr>
                                            <Th>{t("admin.users.table.user")}</Th>
                                            <Th>{t("admin.users.table.role")}</Th>
                                            <Th>{t("admin.users.table.articles")}</Th>
                                            <Th>{t("admin.users.table.createdAt")}</Th>
                                            <Th>{t("admin.users.table.lastLogin")}</Th>
                                            <Th className="text-right">{t("admin.users.table.actions")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className={
                                                    user.id === currentUserId
                                                        ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                                }
                                            >
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatar || ""} alt={user.name} />
                                                            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </Td>
                                                <Td><RoleBadge role={user.role} /></Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{user.articleCount ?? 0}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(user.createdAt, locale)}</Td>
                                                <Td className="text-slate-500 dark:text-slate-400">{formatDate(user.lastLogin, locale)}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button asChild variant="ghost" size="icon" title={t("admin.userDetail.title")}>
                                                            <Link href={`/admin/users/${user.id}`}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setPendingDeleteId(user.id)}
                                                            disabled={user.id === currentUserId}
                                                            title={user.id === currentUserId ? t("admin.users.selfDeleteHint") : ""}
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </TableShell>
                            </div>

                            <div className="md:hidden space-y-3">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className={
                                            "rounded-xl border p-4 " +
                                            (user.id === currentUserId
                                                ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                                                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900")
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                                                    <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate text-slate-900 dark:text-slate-100">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <RoleBadge role={user.role} />
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <div>
                                                <p className="uppercase text-[10px] tracking-wide opacity-70">{t("admin.users.table.articles")}</p>
                                                <p className="text-slate-700 dark:text-slate-200">{user.articleCount ?? 0}</p>
                                            </div>
                                            <div>
                                                <p className="uppercase text-[10px] tracking-wide opacity-70">{t("admin.users.table.lastLogin")}</p>
                                                <p className="text-slate-700 dark:text-slate-200">{formatDate(user.lastLogin, locale)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                                    {t("admin.userDetail.title")}
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPendingDeleteId(user.id)}
                                                disabled={user.id === currentUserId}
                                                className="text-red-600 border-red-200 dark:border-red-900/40"
                                            >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                {t("admin.users.deleteOk")}
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

            <AlertDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) setPendingDeleteId(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.users.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("admin.users.deleteConfirm")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("admin.users.deleteCancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("admin.users.deleting")}
                                </>
                            ) : (
                                t("admin.users.deleteOk")
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdminUsersPage;
