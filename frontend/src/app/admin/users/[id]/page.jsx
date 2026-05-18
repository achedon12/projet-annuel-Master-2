"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
import { ArrowLeft, Loader2, Save, FileText, Lightbulb, ShieldCheck, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel, PanelBody, PanelHeader, LoadingState, ErrorState, EmptyState } from "@/components/admin/AdminUI";
import { API_URL, Urls } from "@/utils/Api";

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

const StatRow = ({ icon: Icon, label, value, iconBg, iconColor }) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        </div>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
);

const AdminUserDetailInner = ({ userId }) => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [user, setUser] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [isSaving, setIsSaving] = useState(false);

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;
    const currentUserId = session?.user?.id ? Number(session.user.id) : null;
    const isSelf = currentUserId !== null && Number(userId) === currentUserId;

    const fetchUser = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const res = await fetch(`${API_URL}${Urls.admin.user(userId)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 404) {
                setLoadState("notfound");
                return;
            }
            if (!res.ok) {
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setUser(data);
            setName(data.name || "");
            setEmail(data.email || "");
            setRole(data.role || "user");
            setLoadState("ready");
        } catch (err) {
            console.error("admin.user.detail.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token, userId]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchUser();
        }
    }, [sessionStatus, fetchUser]);

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}${Urls.admin.user(userId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
            });
            if (!res.ok) {
                let message = t("admin.userDetail.saveError");
                try {
                    const data = await res.json();
                    if (data?.error) message = data.error;
                } catch {
                    /* fallback */
                }
                toast.error(message);
                return;
            }
            const updated = await res.json();
            setUser(updated);
            toast.success(t("admin.userDetail.saveSuccess"));
        } catch (err) {
            console.error("admin.user.detail.save", err);
            toast.error(t("admin.userDetail.saveError"));
        } finally {
            setIsSaving(false);
        }
    };

    const backAction = (
        <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("admin.userDetail.back")}
            </Link>
        </Button>
    );

    return (
        <>
            <AdminPageHeader
                breadcrumb={[
                    { label: t("admin.nav.users"), href: "/admin/users" },
                    { label: user?.name || t("admin.userDetail.title") },
                ]}
                title={user?.name || t("admin.userDetail.title")}
                description={t("admin.userDetail.subtitle")}
                actions={backAction}
            />

            {loadState === "loading" ? (
                <LoadingState />
            ) : loadState === "notfound" ? (
                <EmptyState label={t("admin.userDetail.notFound")} />
            ) : loadState === "error" || !user ? (
                <ErrorState />
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-2">
                        <PanelHeader title={t("admin.userDetail.infoTitle")} hint={t("admin.userDetail.infoHint")} />
                        <PanelBody className="space-y-5">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                                    <AvatarFallback className="text-lg">{initialsOf(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("admin.userDetail.nameLabel")}</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("admin.userDetail.emailLabel")}</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">{t("admin.userDetail.roleLabel")}</Label>
                                <Select value={role} onValueChange={setRole} disabled={isSelf}>
                                    <SelectTrigger id="role" className="w-full md:w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">{t("admin.userDetail.roleUser")}</SelectItem>
                                        <SelectItem value="admin">{t("admin.userDetail.roleAdmin")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isSelf && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t("admin.userDetail.selfRoleHint")}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {isSaving ? t("admin.userDetail.saving") : t("admin.userDetail.save")}
                                </Button>
                            </div>
                        </PanelBody>
                    </Panel>

                    <Panel>
                        <PanelHeader title={t("admin.userDetail.statsTitle")} />
                        <PanelBody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <StatRow
                                icon={FileText}
                                iconBg="bg-emerald-100 dark:bg-emerald-950/40"
                                iconColor="text-emerald-600 dark:text-emerald-400"
                                label={t("admin.userDetail.articlesCount")}
                                value={user.articleCount ?? 0}
                            />
                            <StatRow
                                icon={Lightbulb}
                                iconBg="bg-amber-100 dark:bg-amber-950/40"
                                iconColor="text-amber-600 dark:text-amber-400"
                                label={t("admin.userDetail.ideasCount")}
                                value={user.ideaCount ?? 0}
                            />
                            <StatRow
                                icon={ShieldCheck}
                                iconBg="bg-blue-100 dark:bg-blue-950/40"
                                iconColor="text-blue-600 dark:text-blue-400"
                                label={t("admin.userDetail.loginIpsCount")}
                                value={user.loginIpCount ?? 0}
                            />
                            <StatRow
                                icon={Calendar}
                                iconBg="bg-slate-100 dark:bg-slate-800"
                                iconColor="text-slate-600 dark:text-slate-300"
                                label={t("admin.userDetail.createdAt")}
                                value={formatDate(user.createdAt, locale)}
                            />
                            <StatRow
                                icon={Clock}
                                iconBg="bg-slate-100 dark:bg-slate-800"
                                iconColor="text-slate-600 dark:text-slate-300"
                                label={t("admin.userDetail.lastLogin")}
                                value={formatDate(user.lastLogin, locale)}
                            />
                        </PanelBody>
                    </Panel>
                </div>
            )}
        </>
    );
};

const AdminUserDetailPage = ({ params }) => {
    const resolved = use(params);
    return <AdminUserDetailInner userId={resolved.id} />;
};

export default AdminUserDetailPage;
