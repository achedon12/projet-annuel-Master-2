"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Switch } from "@/components/Switch";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    Panel,
    PanelHeader,
    PanelBody,
    StatusPill,
    LoadingState,
    ErrorState,
    EmptyState,
    TableShell,
    Th,
    Td,
} from "@/components/admin/AdminUI";
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

const AdminBannedIpsPage = () => {
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
        <>
            <AdminPageHeader
                breadcrumb={[{ label: t("admin.nav.bans") }]}
                title={t("admin.bans.title")}
                description={t("admin.bans.subtitle")}
            />

            <div className="grid gap-6 lg:grid-cols-5 mb-6">
                <Panel className="lg:col-span-2">
                    <PanelHeader title={t("admin.bans.create.title")} hint={t("admin.bans.create.description")} />
                    <PanelBody className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ipAddress">{t("admin.bans.create.ipLabel")}</Label>
                            <Input
                                id="ipAddress"
                                value={ipAddress}
                                onChange={(e) => setIpAddress(e.target.value)}
                                placeholder="192.0.2.1"
                                maxLength={45}
                                className="font-mono"
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
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                            <div className="min-w-0">
                                <Label className="cursor-pointer" htmlFor="isPermanent">
                                    {t("admin.bans.create.permanent")}
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                        <div className="flex justify-end pt-1">
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Ban className="mr-2 h-4 w-4" />
                                )}
                                {t("admin.bans.create.submit")}
                            </Button>
                        </div>
                    </PanelBody>
                </Panel>

                <Panel className="lg:col-span-3">
                    <PanelHeader
                        title={t("admin.bans.list.title")}
                        hint={t("admin.bans.list.count", { count: items.length })}
                    />
                    <PanelBody>
                        {loadState === "loading" ? (
                            <LoadingState />
                        ) : loadState === "error" ? (
                            <ErrorState />
                        ) : items.length === 0 ? (
                            <EmptyState label={t("admin.bans.list.empty")} />
                        ) : (
                            <>
                                <div className="hidden md:block">
                                    <TableShell>
                                        <thead>
                                            <tr>
                                                <Th>{t("admin.bans.list.ip")}</Th>
                                                <Th>{t("admin.bans.list.reason")}</Th>
                                                <Th>{t("admin.bans.list.scope")}</Th>
                                                <Th>{t("admin.bans.list.status")}</Th>
                                                <Th className="text-right">{t("admin.bans.list.actions")}</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {items.map((ban) => (
                                                <tr key={ban.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <Td className="font-mono text-xs text-slate-900 dark:text-slate-100">{ban.ipAddress}</Td>
                                                    <Td className="text-slate-500 dark:text-slate-400 max-w-[260px] truncate">{ban.reason || "—"}</Td>
                                                    <Td>
                                                        {ban.isPermanent ? (
                                                            <StatusPill status="permanent">{t("admin.bans.list.permanent")}</StatusPill>
                                                        ) : (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {t("admin.bans.list.until")} {formatDateTime(ban.bannedUntil, locale)}
                                                            </span>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <StatusPill status={ban.active ? "active" : "expired"}>
                                                            {ban.active ? t("admin.bans.list.active") : t("admin.bans.list.expired")}
                                                        </StatusPill>
                                                    </Td>
                                                    <Td className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                            onClick={() => setPendingDeleteId(ban.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </TableShell>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {items.map((ban) => (
                                        <div key={ban.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-mono text-sm text-slate-900 dark:text-slate-100">{ban.ipAddress}</p>
                                                <StatusPill status={ban.active ? "active" : "expired"}>
                                                    {ban.active ? t("admin.bans.list.active") : t("admin.bans.list.expired")}
                                                </StatusPill>
                                            </div>
                                            {ban.reason && (
                                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{ban.reason}</p>
                                            )}
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                {ban.isPermanent
                                                    ? t("admin.bans.list.permanent")
                                                    : `${t("admin.bans.list.until")} ${formatDateTime(ban.bannedUntil, locale)}`}
                                            </p>
                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 dark:border-red-900/40"
                                                    onClick={() => setPendingDeleteId(ban.id)}
                                                >
                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                    {t("admin.bans.deleteOk")}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </PanelBody>
                </Panel>
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
        </>
    );
};

export default AdminBannedIpsPage;
