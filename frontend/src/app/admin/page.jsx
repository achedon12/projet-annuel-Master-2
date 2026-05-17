"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import { Users, FileText, Lightbulb, Mail, Ban, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { API_URL, Urls } from "@/utils/Api";

const STATUS_COLOR = {
    draft: "#94a3b8",
    review: "#f59e0b",
    published: "#10b981",
    archived: "#64748b",
    pending: "#f59e0b",
    processing: "#3b82f6",
    sent: "#10b981",
    failed: "#ef4444",
    unknown: "#cbd5e1",
};

const initialsOf = (name) =>
    (name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("") || "?";

const shortDate = (iso, locale) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
};

const AdminDashboardInner = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [stats, setStats] = useState(null);
    const [loadState, setLoadState] = useState("loading");

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;

    useEffect(() => {
        if (sessionStatus !== "authenticated" || !token) return;
        let cancelled = false;
        setLoadState("loading");
        fetch(`${API_URL}${Urls.admin.stats}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (cancelled) return;
                if (!res.ok) {
                    toast.error(tRef.current("admin.toast.loadError"));
                    setLoadState("error");
                    return;
                }
                const data = await res.json();
                setStats(data);
                setLoadState("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("admin.stats", err);
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
            });
        return () => {
            cancelled = true;
        };
    }, [sessionStatus, token]);

    if (loadState === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("admin.toast.loading")}
            </div>
        );
    }

    if (loadState === "error" || !stats) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                {t("admin.toast.loadError")}
            </div>
        );
    }

    const seriesForChart = (rawSeries) =>
        rawSeries.map((bucket) => ({
            ...bucket,
            label: shortDate(bucket.date, locale),
        }));

    const articlesStatusData = Object.entries(stats.articlesByStatus || {}).map(([status, count]) => ({
        status,
        statusLabel: (() => {
            const key = `history.status.${status}`;
            const translated = t(key);
            return translated === key ? status : translated;
        })(),
        count,
        fill: STATUS_COLOR[status] || STATUS_COLOR.unknown,
    }));

    const mailsStatusData = Object.entries(stats.mailsByStatus || {}).map(([status, count]) => ({
        name: status,
        value: count,
        fill: STATUS_COLOR[status] || STATUS_COLOR.unknown,
    }));

    const kpis = [
        { key: "users", icon: Users, color: "text-blue-600", value: stats.totals.users },
        { key: "articles", icon: FileText, color: "text-emerald-600", value: stats.totals.articles },
        { key: "ideas", icon: Lightbulb, color: "text-amber-600", value: stats.totals.ideas },
        { key: "mails", icon: Mail, color: "text-purple-600", value: stats.totals.mails },
        { key: "bannedIps", icon: Ban, color: "text-red-600", value: stats.totals.bannedIps },
        { key: "loginEvents", icon: ShieldCheck, color: "text-slate-600 dark:text-slate-300", value: stats.totals.loginEvents },
    ];

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("admin.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t("admin.subtitle", { days: stats.windowDays })}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {kpis.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <Card key={kpi.key}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardDescription>{t(`admin.kpi.${kpi.key}`)}</CardDescription>
                                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                                    </div>
                                    <CardTitle className="text-3xl">{kpi.value}</CardTitle>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.charts.signups")}</CardTitle>
                            <CardDescription>{t("admin.charts.signupsHint", { days: stats.windowDays })}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={seriesForChart(stats.series.signups)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name={t("admin.charts.signups")} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.charts.articlesPerDay")}</CardTitle>
                            <CardDescription>{t("admin.charts.articlesHint", { days: stats.windowDays })}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={seriesForChart(stats.series.articles)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name={t("admin.charts.articlesPerDay")} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.charts.articlesByStatus")}</CardTitle>
                            <CardDescription>{t("admin.charts.articlesByStatusHint")}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            {articlesStatusData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                    {t("admin.charts.empty")}
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={articlesStatusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                        <XAxis dataKey="statusLabel" stroke="#94a3b8" fontSize={12} />
                                        <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="count" name={t("admin.kpi.articles")}>
                                            {articlesStatusData.map((entry) => (
                                                <Cell key={entry.status} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.charts.mailsByStatus")}</CardTitle>
                            <CardDescription>{t("admin.charts.mailsByStatusHint")}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            {mailsStatusData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                    {t("admin.charts.empty")}
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={mailsStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {mailsStatusData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.topAuthors.title")}</CardTitle>
                        <CardDescription>{t("admin.topAuthors.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.topAuthors.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin.topAuthors.empty")}</p>
                        ) : (
                            <div className="space-y-3">
                                {stats.topAuthors.map((author, idx) => (
                                    <div
                                        key={author.id}
                                        className="flex items-center justify-between rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="w-7 justify-center">{idx + 1}</Badge>
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={author.avatar || ""} alt={author.name} />
                                                <AvatarFallback>{initialsOf(author.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{author.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{author.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="default">{t("admin.topAuthors.articles", { count: author.articleCount })}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AdminDashboard = () => (
    <AdminGuard>
        <AdminDashboardInner />
    </AdminGuard>
);

export default AdminDashboard;
