"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Separator } from "@/components/Separator";
import { Switch } from "@/components/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Badge } from "@/components/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import { Bell, Check, Link as LinkIcon, Loader2, Palette, Shield, Sparkles, User, X } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/useI18n";
import { useLanguage } from "@/context/LanguageContext";
import { SecurityIpList } from "@/components/settings/SecurityIpList";
import { API_URL, Urls } from "@/utils/Api";

const DEFAULT_NOTIFS = {
    email: true,
    weekly: true,
    ai: true,
    comments: true,
    updates: true,
    tips: false,
};

const initialsOf = (name) =>
    (name || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("") || "?";

const extractError = async (response, fallback) => {
    try {
        const data = await response.json();
        if (data?.error && typeof data.error === "string") return data.error;
    } catch {
        // body non JSON — fallback générique
    }
    return fallback;
};

const Settings = () => {
    const { t, locale } = useTranslation();
    const { changeLocale } = useLanguage();
    const { resolvedTheme, setTheme } = useTheme();
    const { data: session, status: sessionStatus } = useSession();
    const isDark = resolvedTheme === "dark";

    const token = session?.backendToken;

    // Ref stable sur t pour éviter les boucles de fetch.
    const tRef = useRef(t);
    tRef.current = t;

    // État chargé depuis /api/me
    const [loadState, setLoadState] = useState("loading");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState("");
    const [defaultTone, setDefaultTone] = useState("");
    const [defaultWords, setDefaultWords] = useState(800);
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFS);

    // Saisies password séparées (non persistées dans l'objet user)
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Drapeaux de soumission
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [isSavingNotifs, setIsSavingNotifs] = useState(false);

    // Intégration Notion : fetchée depuis /api/integrations/notion.
    const [notionConnected, setNotionConnected] = useState(false);
    const [notionParentPageId, setNotionParentPageId] = useState("");
    const [notionLastSync, setNotionLastSync] = useState(null);
    const [notionTokenInput, setNotionTokenInput] = useState("");
    const [notionPageInput, setNotionPageInput] = useState("");
    const [isSavingNotion, setIsSavingNotion] = useState(false);
    const [isDisconnectingNotion, setIsDisconnectingNotion] = useState(false);

    // Google reste un placeholder désactivé (hors-scope MVP).
    const [googleConnected] = useState(false);

    useEffect(() => {
        if (sessionStatus !== "authenticated" || !token) return;
        let cancelled = false;
        setLoadState("loading");
        fetch(`${API_URL}${Urls.me.get}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (cancelled) return;
                if (!res.ok) {
                    toast.error(tRef.current("settings.toast.loadError"));
                    setLoadState("error");
                    return;
                }
                const data = await res.json();
                setName(data.name || "");
                setEmail(data.email || "");
                setBio(data.bio || "");
                setAvatar(data.avatar || "");
                setDefaultTone(data.defaultTone || "");
                setDefaultWords(typeof data.defaultWords === "number" ? data.defaultWords : 800);
                if (data.notifications && typeof data.notifications === "object") {
                    setNotifications({ ...DEFAULT_NOTIFS, ...data.notifications });
                }
                setLoadState("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("settings.load", err);
                toast.error(tRef.current("settings.toast.loadError"));
                setLoadState("error");
            });
        return () => {
            cancelled = true;
        };
    }, [sessionStatus, token]);

    // Fetch de l'état Notion (séparé du fetch /api/me pour pouvoir recharger après save/disconnect).
    useEffect(() => {
        if (sessionStatus !== "authenticated" || !token) return;
        let cancelled = false;
        fetch(`${API_URL}${Urls.integrations.notion}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (cancelled || !res.ok) return;
                const data = await res.json();
                setNotionConnected(Boolean(data?.connected));
                setNotionParentPageId(data?.parentPageId || "");
                setNotionLastSync(data?.lastSync || null);
            })
            .catch(() => {
                /* silencieux — fetchera à la prochaine ouverture du tab */
            });
        return () => {
            cancelled = true;
        };
    }, [sessionStatus, token]);

    const handleConnectNotion = async () => {
        if (!token) return;
        const trimmedToken = notionTokenInput.trim();
        const trimmedPage = notionPageInput.trim();
        if (trimmedToken === "") {
            toast.error(t("settings.integrations.notion.toast.tokenRequired"));
            return;
        }
        if (trimmedPage === "") {
            toast.error(t("settings.integrations.notion.toast.pageRequired"));
            return;
        }
        setIsSavingNotion(true);
        try {
            const res = await fetch(`${API_URL}${Urls.integrations.notion}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ apiKey: trimmedToken, parentPageId: trimmedPage }),
            });
            if (!res.ok) {
                const msg = await extractError(res, t("settings.integrations.notion.toast.saveError"));
                toast.error(msg);
                return;
            }
            const data = await res.json();
            setNotionConnected(Boolean(data?.connected));
            setNotionParentPageId(data?.parentPageId || "");
            setNotionLastSync(data?.lastSync || null);
            setNotionTokenInput("");
            setNotionPageInput("");
            toast.success(t("settings.integrations.notion.toast.saveSuccess"));
        } catch {
            toast.error(t("settings.integrations.notion.toast.saveError"));
        } finally {
            setIsSavingNotion(false);
        }
    };

    const handleDisconnectNotion = async () => {
        if (!token) return;
        setIsDisconnectingNotion(true);
        try {
            const res = await fetch(`${API_URL}${Urls.integrations.notion}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                toast.error(t("settings.integrations.notion.toast.disconnectError"));
                return;
            }
            setNotionConnected(false);
            setNotionParentPageId("");
            setNotionLastSync(null);
            toast.success(t("settings.integrations.notion.toast.disconnectSuccess"));
        } catch {
            toast.error(t("settings.integrations.notion.toast.disconnectError"));
        } finally {
            setIsDisconnectingNotion(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!token) return;
        if (name.trim() === "") {
            toast.error(t("settings.toast.nameRequired"));
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error(t("settings.toast.emailInvalid"));
            return;
        }
        setIsSavingProfile(true);
        try {
            const res = await fetch(`${API_URL}${Urls.me.update}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    bio: bio || null,
                    avatar: avatar || null,
                }),
            });
            if (!res.ok) {
                toast.error(await extractError(res, t("settings.toast.saveError")));
                return;
            }
            toast.success(t("settings.toast.saved"));
        } catch (err) {
            console.error("settings.profile", err);
            toast.error(t("settings.toast.saveError"));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;
        if (!currentPassword || !newPassword) {
            toast.error(t("settings.toast.passwordRequired"));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t("settings.toast.passwordMismatch"));
            return;
        }
        if (newPassword.length < 6) {
            toast.error(t("settings.toast.passwordTooShort"));
            return;
        }
        setIsChangingPassword(true);
        try {
            const res = await fetch(`${API_URL}${Urls.me.password}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) {
                toast.error(await extractError(res, t("settings.toast.passwordError")));
                return;
            }
            toast.success(t("settings.toast.passwordChanged"));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error("settings.password", err);
            toast.error(t("settings.toast.passwordError"));
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSavePrefs = async () => {
        if (!token) return;
        if (!Number.isInteger(defaultWords) || defaultWords < 100 || defaultWords > 5000) {
            toast.error(t("settings.toast.wordsRange"));
            return;
        }
        setIsSavingPrefs(true);
        try {
            const res = await fetch(`${API_URL}${Urls.me.update}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    language: locale,
                    theme: isDark ? "dark" : "light",
                    defaultTone: defaultTone || null,
                    defaultWords,
                }),
            });
            if (!res.ok) {
                toast.error(await extractError(res, t("settings.toast.saveError")));
                return;
            }
            toast.success(t("settings.toast.saved"));
        } catch (err) {
            console.error("settings.prefs", err);
            toast.error(t("settings.toast.saveError"));
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const handleSaveNotifs = async () => {
        if (!token) return;
        setIsSavingNotifs(true);
        try {
            const res = await fetch(`${API_URL}${Urls.me.notifications}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    notifEmail: notifications.email,
                    notifWeekly: notifications.weekly,
                    notifAi: notifications.ai,
                    notifComments: notifications.comments,
                    notifUpdates: notifications.updates,
                    notifTips: notifications.tips,
                }),
            });
            if (!res.ok) {
                toast.error(await extractError(res, t("settings.toast.saveError")));
                return;
            }
            toast.success(t("settings.toast.saved"));
        } catch (err) {
            console.error("settings.notifs", err);
            toast.error(t("settings.toast.saveError"));
        } finally {
            setIsSavingNotifs(false);
        }
    };

    const setNotif = (key) => (value) =>
        setNotifications((prev) => ({ ...prev, [key]: value }));

    if (loadState === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("settings.toast.loading")}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("settings.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("settings.subTitle")}</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList>
                        <TabsTrigger value="profile">
                            <User className="mr-2 h-4 w-4" />
                            {t("settings.tabs.profile")}
                        </TabsTrigger>
                        <TabsTrigger value="integrations">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            {t("settings.tabs.integrations")}
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            {t("settings.tabs.notifications")}
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="mr-2 h-4 w-4" />
                            {t("settings.tabs.security")}
                        </TabsTrigger>
                        <TabsTrigger value="preferences">
                            <Palette className="mr-2 h-4 w-4" />
                            {t("settings.tabs.preferences")}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.profile.title")}</CardTitle>
                                <CardDescription>{t("settings.profile.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={avatar || ""} alt={name} />
                                        <AvatarFallback className="text-lg">{initialsOf(name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="avatarUrl" className="text-xs">{t("settings.profile.avatarUrl")}</Label>
                                        <Input
                                            id="avatarUrl"
                                            value={avatar}
                                            onChange={(e) => setAvatar(e.target.value)}
                                            placeholder="https://..."
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.profile.avatarHint")}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("form.name")}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={100}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("form.email")}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        maxLength={255}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">{t("form.bio")}</Label>
                                    <Input
                                        id="bio"
                                        placeholder={t("settings.profile.bioPlaceholder")}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        maxLength={1000}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                        {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("common.save")}
                                    </Button>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-medium">{t("common.changePassword")}</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">{t("common.actualPassword")}</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">{t("common.newPassword")}</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">{t("common.confirmNewPassword")}</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleChangePassword} disabled={isChangingPassword} variant="outline">
                                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t("common.changePassword")}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.integrations.title")}</CardTitle>
                                <CardDescription>{t("settings.integrations.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="rounded-lg border dark:border-slate-800 p-4">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                <LinkIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">Notion</h3>
                                                    {notionConnected ? (
                                                        <Badge variant="default" className="gap-1">
                                                            <Check className="h-3 w-3" />
                                                            {t("common.connected")}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <X className="h-3 w-3" />
                                                            {t("common.disconnected")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {t("settings.integrations.notion.description")}
                                                </p>
                                            </div>
                                        </div>
                                        {notionConnected && (
                                            <Button
                                                variant="outline"
                                                onClick={handleDisconnectNotion}
                                                disabled={isDisconnectingNotion}
                                            >
                                                {isDisconnectingNotion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {t("settings.integrations.notion.disconnect")}
                                            </Button>
                                        )}
                                    </div>

                                    {notionConnected ? (
                                        <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide opacity-70">
                                                    {t("settings.integrations.notion.parentPageLabel")}
                                                </p>
                                                <p className="font-mono break-all text-slate-700 dark:text-slate-300">
                                                    {notionParentPageId || "—"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide opacity-70">
                                                    {t("settings.integrations.notion.lastSyncLabel")}
                                                </p>
                                                <p className="text-slate-700 dark:text-slate-300">
                                                    {notionLastSync
                                                        ? new Date(notionLastSync).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
                                                              dateStyle: "medium",
                                                              timeStyle: "short",
                                                          })
                                                        : t("settings.integrations.notion.neverSynced")}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="notion-token">
                                                    {t("settings.integrations.notion.tokenLabel")}
                                                </Label>
                                                <Input
                                                    id="notion-token"
                                                    type="password"
                                                    autoComplete="off"
                                                    value={notionTokenInput}
                                                    onChange={(e) => setNotionTokenInput(e.target.value)}
                                                    placeholder={t("settings.integrations.notion.tokenPlaceholder")}
                                                    maxLength={500}
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {t("settings.integrations.notion.tokenHint")}
                                                </p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="notion-page">
                                                    {t("settings.integrations.notion.pageLabel")}
                                                </Label>
                                                <Input
                                                    id="notion-page"
                                                    value={notionPageInput}
                                                    onChange={(e) => setNotionPageInput(e.target.value)}
                                                    placeholder={t("settings.integrations.notion.pagePlaceholder")}
                                                    maxLength={500}
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {t("settings.integrations.notion.pageHint")}
                                                </p>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button onClick={handleConnectNotion} disabled={isSavingNotion}>
                                                    {isSavingNotion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {t("common.connect")}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between rounded-lg border dark:border-slate-800 p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                            <svg className="h-6 w-6" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">Google Account</h3>
                                                {googleConnected ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <Check className="h-3 w-3" />
                                                        {t("common.connected")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <X className="h-3 w-3" />
                                                        {t("common.disconnected")}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {t("settings.integrations.google.description")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled
                                        title={t("settings.integrations.toast.googleSoon")}
                                    >
                                        {t("common.connect")}
                                    </Button>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t("settings.integrations.googleSoonHint")}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.notifications.title")}</CardTitle>
                                <CardDescription>{t("settings.notifications.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.notifications.email")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.emailHint")}</p>
                                    </div>
                                    <Switch checked={notifications.email} onCheckedChange={setNotif("email")} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.notifications.weekly")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.weeklyHint")}</p>
                                    </div>
                                    <Switch checked={notifications.weekly} onCheckedChange={setNotif("weekly")} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.notifications.ai")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.aiHint")}</p>
                                    </div>
                                    <Switch checked={notifications.ai} onCheckedChange={setNotif("ai")} />
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>{t("settings.notifications.types")}</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.comments")}</span>
                                            <Switch checked={notifications.comments} onCheckedChange={setNotif("comments")} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.updates")}</span>
                                            <Switch checked={notifications.updates} onCheckedChange={setNotif("updates")} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.tips")}</span>
                                            <Switch checked={notifications.tips} onCheckedChange={setNotif("tips")} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveNotifs} disabled={isSavingNotifs}>
                                        {isSavingNotifs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("settings.notifications.savePrefs")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <SecurityIpList />
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.preferences.title")}</CardTitle>
                                <CardDescription>{t("settings.preferences.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="language">{t("settings.preferences.language")}</Label>
                                    <Select value={locale} onValueChange={changeLocale}>
                                        <SelectTrigger id="language">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        {t("settings.preferences.aiSettings")}
                                    </Label>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultTone" className="text-sm">
                                            {t("settings.preferences.defaultTone")}
                                        </Label>
                                        <Select value={defaultTone || ""} onValueChange={setDefaultTone}>
                                            <SelectTrigger id="defaultTone">
                                                <SelectValue placeholder={t("editor.tonePlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">{t("editor.tones.professional")}</SelectItem>
                                                <SelectItem value="casual">{t("editor.tones.casual")}</SelectItem>
                                                <SelectItem value="friendly">{t("editor.tones.friendly")}</SelectItem>
                                                <SelectItem value="formal">{t("editor.tones.formal")}</SelectItem>
                                                <SelectItem value="enthusiastic">{t("editor.tones.enthusiastic")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultWords" className="text-sm">
                                            {t("settings.preferences.defaultWords")}
                                        </Label>
                                        <Input
                                            id="defaultWords"
                                            type="number"
                                            min={100}
                                            max={5000}
                                            value={defaultWords}
                                            onChange={(e) => setDefaultWords(Number(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.preferences.darkMode")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.preferences.darkModeHint")}</p>
                                    </div>
                                    <Switch
                                        checked={isDark}
                                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSavePrefs} disabled={isSavingPrefs}>
                                        {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("settings.notifications.savePrefs")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Settings;
