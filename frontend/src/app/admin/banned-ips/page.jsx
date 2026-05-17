"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Switch } from "@/components/Switch";
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
import { Ban, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { API_URL, Urls } from "@/utils/Api";

const formatDateTime = (iso, locale) => {
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

const AdminBannedIpsInner = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [items, setItems] = useState([]);
    const [loadState, setLoadState] = useState("loading");
    const [ipAddress, setIpAddress] = useState("");
    const [reason, setReason] = useState("");
    const [isPermanent, setIsPermanent] = useState(false);
    const [bannedUntil, setBannedUntil] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;

    const fetchBans = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const res = await fetch(`${API_URL}${Urls.admin.bannedIps}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setItems(Array.isArray(data.items) ? data.items : []);
            setLoadState("ready");
        } catch (err) {
            console.error("admin.bans.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchBans();
        }
    }, [sessionStatus, fetchBans]);

    const handleCreate = async () => {
        if (!token) return;
        const trimmedIp = ipAddress.trim();
        if (!trimmedIp) {
            toast.error(t("admin.bans.toast.ipRequired"));
            return;
        }
        if (!isPermanent && bannedUntil === "") {
            toast.error(t("admin.bans.toast.untilRequired"));
            return;
        }

        setIsCreating(true);
        try {
            const payload = {
                ipAddress: trimmedIp,
                reason: reason.trim() || null,
                isPermanent,
            };
            if (!isPermanent && bannedUntil !== "") {
                payload.bannedUntil = new Date(bannedUntil).toISOString();
            }
            const res = await fetch(`${API_URL}${Urls.admin.bannedIps}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let message = t("admin.bans.toast.createError");
                try {
                    const data = await res.json();
                    if (data?.error) message = data.error;
                } catch {
                    /* fallback */
                }
                toast.error(message);
                return;
            }
            const created = await res.json();
            setItems((prev) => [created, ...prev]);
            toast.success(t("admin.bans.toast.createSuccess"));
            setIpAddress("");
            setReason("");
            setIsPermanent(false);
            setBannedUntil("");
        } catch (err) {
            console.error("admin.bans.create", err);
            toast.error(t("admin.bans.toast.createError"));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!pendingDeleteId || !token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.admin.bannedIp(pendingDeleteId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                toast.error(t("admin.bans.toast.deleteError"));
                return;
            }
            setItems((prev) => prev.filter((b) => b.id !== pendingDeleteId));
            toast.success(t("admin.bans.toast.deleteSuccess"));
        } catch (err) {
            console.error("admin.bans.delete", err);
            toast.error(t("admin.bans.toast.deleteError"));
        } finally {
            setIsDeleting(false);
            setPendingDeleteId(null);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-3xl">{t("admin.bans.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("admin.bans.subtitle")}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.bans.create.title")}</CardTitle>
                        <CardDescription>{t("admin.bans.create.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ipAddress">{t("admin.bans.create.ipLabel")}</Label>
                                <Input
                                    id="ipAddress"
                                    value={ipAddress}
                                    onChange={(e) => setIpAddress(e.target.value)}
                                    placeholder="192.0.2.1"
                                    maxLength={45}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">{t("admin.bans.create.reasonLabel")}</Label>
                                <Input
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t("admin.bans.create.reasonPlaceholder")}
                                    maxLength={500}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 items-end">
                            <div className="flex items-center justify-between rounded-md border dark:border-slate-800 px-3 py-2">
                                <div>
                                    <Label className="cursor-pointer" htmlFor="isPermanent">
                                        {t("admin.bans.create.permanent")}
                                    </Label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t("admin.bans.create.permanentHint")}
                                    </p>
                                </div>
                                <Switch id="isPermanent" checked={isPermanent} onCheckedChange={setIsPermanent} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bannedUntil">{t("admin.bans.create.untilLabel")}</Label>
                                <Input
                                    id="bannedUntil"
                                    type="datetime-local"
                                    value={bannedUntil}
                                    onChange={(e) => setBannedUntil(e.target.value)}
                                    disabled={isPermanent}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Ban className="mr-2 h-4 w-4" />
                                )}
                                {t("admin.bans.create.submit")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.bans.list.title")}</CardTitle>
                        <CardDescription>{t("admin.bans.list.count", { count: items.length })}</CardDescription>
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
                                {t("admin.bans.list.empty")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border dark:border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-2">{t("admin.bans.list.ip")}</th>
                                            <th className="px-4 py-2">{t("admin.bans.list.reason")}</th>
                                            <th className="px-4 py-2">{t("admin.bans.list.scope")}</th>
                                            <th className="px-4 py-2">{t("admin.bans.list.status")}</th>
                                            <th className="px-4 py-2">{t("admin.bans.list.createdAt")}</th>
                                            <th className="px-4 py-2 text-right">{t("admin.bans.list.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {items.map((ban) => (
                                            <tr key={ban.id}>
                                                <td className="px-4 py-3 font-mono">{ban.ipAddress}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{ban.reason || "—"}</td>
                                                <td className="px-4 py-3">
                                                    {ban.isPermanent ? (
                                                        <Badge variant="destructive">{t("admin.bans.list.permanent")}</Badge>
                                                    ) : (
                                                        <span className="text-slate-600 dark:text-slate-400">
                                                            {t("admin.bans.list.until")} {formatDateTime(ban.bannedUntil, locale)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={ban.active ? "default" : "secondary"}>
                                                        {ban.active ? t("admin.bans.list.active") : t("admin.bans.list.expired")}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {formatDateTime(ban.createdAt, locale)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600"
                                                        onClick={() => setPendingDeleteId(ban.id)}
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
                        <AlertDialogTitle>{t("admin.bans.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("admin.bans.deleteConfirm")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("admin.bans.deleteCancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("admin.bans.deleting")}
                                </>
                            ) : (
                                t("admin.bans.deleteOk")
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const AdminBannedIpsPage = () => (
    <AdminGuard>
        <AdminBannedIpsInner />
    </AdminGuard>
);

export default AdminBannedIpsPage;
