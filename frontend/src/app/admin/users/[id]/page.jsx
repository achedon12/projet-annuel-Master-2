"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Badge } from "@/components/Badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";
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

const AdminUserDetailInner = ({ userId }) => {
    const { t, locale } = useTranslation();
    const router = useRouter();
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

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("admin.userDetail.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.subtitle")}</p>
                </div>

                <AdminNav />

                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/users">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        {t("admin.userDetail.back")}
                    </Link>
                </Button>

                {loadState === "loading" ? (
                    <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("admin.toast.loading")}
                    </div>
                ) : loadState === "notfound" ? (
                    <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("admin.userDetail.notFound")}
                    </div>
                ) : loadState === "error" || !user ? (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                        {t("admin.toast.loadError")}
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>{t("admin.userDetail.infoTitle")}</CardTitle>
                                <CardDescription>{t("admin.userDetail.infoHint")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("admin.userDetail.nameLabel")}</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("admin.userDetail.emailLabel")}</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">{t("admin.userDetail.roleLabel")}</Label>
                                    <Select value={role} onValueChange={setRole} disabled={isSelf}>
                                        <SelectTrigger id="role">
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
                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        {isSaving ? t("admin.userDetail.saving") : t("admin.userDetail.save")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("admin.userDetail.statsTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.articlesCount")}</span>
                                    <Badge variant="secondary">{user.articleCount ?? 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.ideasCount")}</span>
                                    <Badge variant="secondary">{user.ideaCount ?? 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.loginIpsCount")}</span>
                                    <Badge variant="secondary">{user.loginIpCount ?? 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.createdAt")}</span>
                                    <span>{formatDate(user.createdAt, locale)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.userDetail.lastLogin")}</span>
                                    <span>{formatDate(user.lastLogin, locale)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminUserDetailPage = ({ params }) => {
    const resolved = use(params);
    return (
        <AdminGuard>
            <AdminUserDetailInner userId={resolved.id} />
        </AdminGuard>
    );
};

export default AdminUserDetailPage;
