"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Separator } from "@/components/Separator";
import { Switch } from "@/components/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import { Bell, Check, Link as LinkIcon, Loader2, Palette, Shield, Sparkles, User, X, KeyRound, Moon } from "lucide-react";
import { PageShell, PageHeader, SectionCard, StatusBadge } from "@/components/ui-kit";
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

    // Intégration Google Calendar : fetchée depuis /api/integrations/google.
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleScopes, setGoogleScopes] = useState("");
    const [googleLastSync, setGoogleLastSync] = useState(null);
    const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);

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

    // Fetch de l'état Google (séparé pour pouvoir recharger après connect/disconnect).
    useEffect(() => {
        if (sessionStatus !== "authenticated" || !token) return;
        let cancelled = false;
        fetch(`${API_URL}${Urls.integrations.google}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (cancelled || !res.ok) return;
                const data = await res.json();
                setGoogleConnected(Boolean(data?.connected));
                setGoogleScopes(data?.scopes || "");
                setGoogleLastSync(data?.lastSync || null);
            })
            .catch(() => {
                /* silencieux */
            });
        return () => {
            cancelled = true;
        };
    }, [sessionStatus, token]);

    const handleConnectGoogleCalendar = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            toast.error(t("settings.integrations.google.toast.clientIdMissing"));
            return;
        }
        const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "https://www.googleapis.com/auth/calendar.events",
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
        });
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    };

    const handleDisconnectGoogle = async () => {
        if (!token) return;
        setIsDisconnectingGoogle(true);
        try {
            const res = await fetch(`${API_URL}${Urls.integrations.google}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                toast.error(t("settings.integrations.google.toast.disconnectError"));
                return;
            }
            setGoogleConnected(false);
            setGoogleScopes("");
            setGoogleLastSync(null);
            toast.success(t("settings.integrations.google.toast.disconnectSuccess"));
        } catch {
            toast.error(t("settings.integrations.google.toast.disconnectError"));
        } finally {
            setIsDisconnectingGoogle(false);
        }
    };

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
        <PageShell>
            <PageHeader
                eyebrow={t("settings.eyebrow")}
                title={t("settings.title")}
                description={t("settings.subTitle")}
            />

            <Tabs defaultValue="profile" className="w-full space-y-6">
                <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-white p-1 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-auto">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300">
                        <User className="mr-2 h-4 w-4" />
                        {t("settings.tabs.profile")}
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        {t("settings.tabs.integrations")}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300">
                        <Bell className="mr-2 h-4 w-4" />
                        {t("settings.tabs.notifications")}
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300">
                        <Shield className="mr-2 h-4 w-4" />
                        {t("settings.tabs.security")}
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300">
                        <Palette className="mr-2 h-4 w-4" />
                        {t("settings.tabs.preferences")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-0">
                    <SectionCard
                        title={t("settings.profile.title")}
                        description={t("settings.profile.description")}
                        padding="md"
                    >
                        <div className="space-y-6">
                            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                                <Avatar className="h-20 w-20 ring-2 ring-emerald-100 dark:ring-emerald-950/40">
                                    <AvatarImage src={avatar || ""} alt={name} />
                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-lg font-semibold">
                                        {initialsOf(name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 w-full space-y-2">
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

                            <div className="grid gap-4 md:grid-cols-2">
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

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("common.save")}
                                </Button>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title={t("common.changePassword")}
                        description={t("settings.passwordDescription")}
                        padding="md"
                    >
                        <div className="space-y-4">
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
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                    variant="outline"
                                    className="rounded-lg"
                                >
                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    {t("common.changePassword")}
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-4 mt-0">
                    <div className="grid gap-4">
                        {/* Notion */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                                            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.139v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notion</h3>
                                            {notionConnected ? (
                                                <StatusBadge variant="success" icon={Check}>{t("common.connected")}</StatusBadge>
                                            ) : (
                                                <StatusBadge variant="neutral" icon={X}>{t("common.disconnected")}</StatusBadge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            {t("settings.integrations.notion.description")}
                                        </p>
                                    </div>
                                </div>
                                {notionConnected && (
                                    <Button
                                        variant="outline"
                                        onClick={handleDisconnectNotion}
                                        disabled={isDisconnectingNotion}
                                        className="rounded-lg"
                                    >
                                        {isDisconnectingNotion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("settings.integrations.notion.disconnect")}
                                    </Button>
                                )}
                            </div>

                            {notionConnected ? (
                                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 dark:bg-slate-800/40">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t("settings.integrations.notion.parentPageLabel")}
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                                            {notionParentPageId || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t("settings.integrations.notion.lastSyncLabel")}
                                        </p>
                                        <p className="mt-1 text-slate-700 dark:text-slate-300">
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
                                <div className="mt-5 space-y-3">
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
                                    <div className="flex justify-end pt-1">
                                        <Button
                                            onClick={handleConnectNotion}
                                            disabled={isSavingNotion}
                                            className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            {isSavingNotion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t("common.connect")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Google Calendar */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                        <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden>
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Google Calendar</h3>
                                            {googleConnected ? (
                                                <StatusBadge variant="success" icon={Check}>{t("common.connected")}</StatusBadge>
                                            ) : (
                                                <StatusBadge variant="neutral" icon={X}>{t("common.disconnected")}</StatusBadge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            {t("settings.integrations.google.description")}
                                        </p>
                                    </div>
                                </div>
                                {googleConnected ? (
                                    <Button
                                        variant="outline"
                                        onClick={handleDisconnectGoogle}
                                        disabled={isDisconnectingGoogle}
                                        className="rounded-lg"
                                    >
                                        {isDisconnectingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t("settings.integrations.google.disconnect")}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleConnectGoogleCalendar}
                                        className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        {t("common.connect")}
                                    </Button>
                                )}
                            </div>

                            {googleConnected && (
                                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 dark:bg-slate-800/40">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t("settings.integrations.google.scopesLabel")}
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                                            {googleScopes || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t("settings.integrations.google.lastSyncLabel")}
                                        </p>
                                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                                            {googleLastSync
                                                ? new Date(googleLastSync).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
                                                      dateStyle: "medium",
                                                      timeStyle: "short",
                                                  })
                                                : t("settings.integrations.google.neverSynced")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 mt-0">
                    <SectionCard
                        title={t("settings.notifications.title")}
                        description={t("settings.notifications.description")}
                        padding="md"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 py-3">
                                <div className="space-y-0.5 min-w-0">
                                    <Label>{t("settings.notifications.email")}</Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.emailHint")}</p>
                                </div>
                                <Switch checked={notifications.email} onCheckedChange={setNotif("email")} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-4 py-3">
                                <div className="space-y-0.5 min-w-0">
                                    <Label>{t("settings.notifications.weekly")}</Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.weeklyHint")}</p>
                                </div>
                                <Switch checked={notifications.weekly} onCheckedChange={setNotif("weekly")} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-4 py-3">
                                <div className="space-y-0.5 min-w-0">
                                    <Label>{t("settings.notifications.ai")}</Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.notifications.aiHint")}</p>
                                </div>
                                <Switch checked={notifications.ai} onCheckedChange={setNotif("ai")} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {t("settings.notifications.types")}
                            </Label>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{t("settings.notifications.comments")}</span>
                                    <Switch checked={notifications.comments} onCheckedChange={setNotif("comments")} />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{t("settings.notifications.updates")}</span>
                                    <Switch checked={notifications.updates} onCheckedChange={setNotif("updates")} />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{t("settings.notifications.tips")}</span>
                                    <Switch checked={notifications.tips} onCheckedChange={setNotif("tips")} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSaveNotifs}
                                disabled={isSavingNotifs}
                                className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {isSavingNotifs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("settings.notifications.savePrefs")}
                            </Button>
                        </div>
                    </SectionCard>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-0">
                    <SecurityIpList />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6 mt-0">
                    <SectionCard
                        title={t("settings.preferences.title")}
                        description={t("settings.preferences.description")}
                        padding="md"
                    >
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
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
                            </div>

                            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                        <Moon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <Label className="cursor-pointer">{t("settings.preferences.darkMode")}</Label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.preferences.darkModeHint")}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isDark}
                                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title={t("settings.preferences.aiSettings")}
                        description={t("settings.preferences.aiDescription")}
                        padding="md"
                    >
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="defaultTone">
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
                                    <Label htmlFor="defaultWords">
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

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSavePrefs}
                                    disabled={isSavingPrefs}
                                    className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t("common.save")}
                                </Button>
                            </div>
                        </div>
                    </SectionCard>
                </TabsContent>
            </Tabs>
        </PageShell>
    );
};

export default Settings;
