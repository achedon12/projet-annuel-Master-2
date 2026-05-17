"use client";
import { useState } from "react";
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
import { Bell, Check, Link as LinkIcon, Mail, Palette, Shield, Sparkles, User, X } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/useI18n";
import { useLanguage } from "@/context/LanguageContext";
import { SecurityIpList } from "@/components/settings/SecurityIpList";

const Settings = () => {
    const { t, locale } = useTranslation();
    const { changeLocale } = useLanguage();
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [notionConnected, setNotionConnected] = useState(true);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState(true);

    const handleSave = () => {
        toast.success(t("settings.toast.saved"));
    };

    const handleConnectNotion = () => {
        setNotionConnected(!notionConnected);
        toast.success(
            notionConnected
                ? t("settings.integrations.toast.notionDisconnected")
                : t("settings.integrations.toast.notionConnected")
        );
    };

    const handleConnectGoogle = () => {
        setGoogleConnected(!googleConnected);
        toast.success(
            googleConnected
                ? t("settings.integrations.toast.googleDisconnected")
                : t("settings.integrations.toast.googleConnected")
        );
    };

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
                                        <AvatarImage src="" />
                                        <AvatarFallback className="text-lg">JD</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm">
                                            {t("common.changePicture")}
                                        </Button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.profile.avatarHint")}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">{t("form.firstName")}</Label>
                                        <Input id="firstName" defaultValue="Jean" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">{t("form.name")}</Label>
                                        <Input id="lastName" defaultValue="Dupont" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("form.email")}</Label>
                                    <Input id="email" type="email" defaultValue="jean.dupont@email.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">{t("form.bio")}</Label>
                                    <Input
                                        id="bio"
                                        placeholder={t("settings.profile.bioPlaceholder")}
                                        defaultValue={t("settings.profile.bioDefault")}
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-medium">{t("common.changePassword")}</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">{t("common.actualPassword")}</Label>
                                        <Input id="currentPassword" type="password" />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">{t("common.newPassword")}</Label>
                                            <Input id="newPassword" type="password" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">{t("common.confirmNewPassword")}</Label>
                                            <Input id="confirmPassword" type="password" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline">{t("common.cancel")}</Button>
                                    <Button onClick={handleSave}>{t("common.save")}</Button>
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
                                <div className="flex items-center justify-between rounded-lg border dark:border-slate-800 p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                            <Mail className="h-6 w-6 text-slate-700 dark:text-slate-300" />
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
                                    <Button
                                        variant={notionConnected ? "outline" : "default"}
                                        onClick={handleConnectNotion}
                                    >
                                        {notionConnected ? t("common.disconnect") : t("common.connect")}
                                    </Button>
                                </div>

                                {notionConnected && (
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4">
                                        <h4 className="mb-3 text-sm font-medium">
                                            {t("settings.integrations.notion.config")}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="notionWorkspace">
                                                    {t("settings.integrations.notion.workspace")}
                                                </Label>
                                                <Input
                                                    id="notionWorkspace"
                                                    defaultValue={t("settings.integrations.notion.workspaceDefault")}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="notionDatabase">
                                                    {t("settings.integrations.notion.database")}
                                                </Label>
                                                <Select defaultValue="articles">
                                                    <SelectTrigger id="notionDatabase">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="articles">
                                                            {t("settings.integrations.notion.databases.articles")}
                                                        </SelectItem>
                                                        <SelectItem value="ideas">
                                                            {t("settings.integrations.notion.databases.ideas")}
                                                        </SelectItem>
                                                        <SelectItem value="calendar">
                                                            {t("settings.integrations.notion.databases.calendar")}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t("settings.integrations.notion.autoSync")}</Label>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {t("settings.integrations.notion.autoSyncHint")}
                                                    </p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex items-center justify-between rounded-lg border dark:border-slate-800 p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                            <svg className="h-6 w-6" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
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
                                        variant={googleConnected ? "outline" : "default"}
                                        onClick={handleConnectGoogle}
                                    >
                                        {googleConnected ? t("common.disconnect") : t("common.connect")}
                                    </Button>
                                </div>
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
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t("settings.notifications.emailHint")}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.notifications.weekly")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t("settings.notifications.weeklyHint")}
                                        </p>
                                    </div>
                                    <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.notifications.ai")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t("settings.notifications.aiHint")}
                                        </p>
                                    </div>
                                    <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>{t("settings.notifications.types")}</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.comments")}</span>
                                            <Switch defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.updates")}</span>
                                            <Switch defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{t("settings.notifications.tips")}</span>
                                            <Switch />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave}>{t("settings.notifications.savePrefs")}</Button>
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

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">{t("settings.preferences.timezone")}</Label>
                                    <Select defaultValue="paris">
                                        <SelectTrigger id="timezone">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paris">Europe/Paris (GMT+1)</SelectItem>
                                            <SelectItem value="london">Europe/London (GMT+0)</SelectItem>
                                            <SelectItem value="newyork">America/New_York (GMT-5)</SelectItem>
                                            <SelectItem value="tokyo">Asia/Tokyo (GMT+9)</SelectItem>
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
                                        <Select defaultValue="professional">
                                            <SelectTrigger id="defaultTone">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">{t("editor.tones.professional")}</SelectItem>
                                                <SelectItem value="casual">{t("editor.tones.casual")}</SelectItem>
                                                <SelectItem value="friendly">{t("editor.tones.friendly")}</SelectItem>
                                                <SelectItem value="formal">{t("editor.tones.formal")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultWords" className="text-sm">
                                            {t("settings.preferences.defaultWords")}
                                        </Label>
                                        <Input id="defaultWords" type="number" defaultValue="800" />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.preferences.darkMode")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t("settings.preferences.darkModeHint")}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isDark}
                                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave}>{t("settings.notifications.savePrefs")}</Button>
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
