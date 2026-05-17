"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
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
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
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

const AdminUsersInner = () => {
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
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-3xl">{t("admin.users.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t("admin.users.subtitle", { count: total })}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>{t("admin.users.listTitle")}</CardTitle>
                                <CardDescription>{t("admin.users.listHint")}</CardDescription>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <Input
                                    placeholder={t("admin.users.searchPlaceholder")}
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
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
                        ) : users.length === 0 ? (
                            <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                {t("admin.users.empty")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border dark:border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-2">{t("admin.users.table.user")}</th>
                                            <th className="px-4 py-2">{t("admin.users.table.role")}</th>
                                            <th className="px-4 py-2">{t("admin.users.table.articles")}</th>
                                            <th className="px-4 py-2">{t("admin.users.table.createdAt")}</th>
                                            <th className="px-4 py-2">{t("admin.users.table.lastLogin")}</th>
                                            <th className="px-4 py-2 text-right">{t("admin.users.table.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {users.map((user) => (
                                            <tr key={user.id} className={user.id === currentUserId ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{user.articleCount ?? 0}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {formatDate(user.createdAt, locale)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {formatDate(user.lastLogin, locale)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setPendingDeleteId(user.id)}
                                                        disabled={user.id === currentUserId}
                                                        title={user.id === currentUserId ? t("admin.users.selfDeleteHint") : ""}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {total > PER_PAGE && (
                            <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>{t("admin.users.pagination", { page, totalPages })}</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        {t("admin.users.prev")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        {t("admin.users.next")}
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
        </div>
    );
};

const AdminUsersPage = () => (
    <AdminGuard>
        <AdminUsersInner />
    </AdminGuard>
);

export default AdminUsersPage;
