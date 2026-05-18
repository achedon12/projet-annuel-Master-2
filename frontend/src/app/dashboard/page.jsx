"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/Card";
import { Button } from "@/components/Button";
import {
    FileText,
    TrendingUp,
    Calendar,
    Sparkles,
    ArrowRight,
    Loader2,
} from "lucide-react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const STATUS_COLOR = {
    published: "text-emerald-600 dark:text-emerald-400",
    draft: "text-slate-500 dark:text-slate-400",
    review: "text-amber-600 dark:text-amber-400",
    archived: "text-slate-400 dark:text-slate-500",
};

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

const longDate = (iso, locale) => {
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

const formatCompactNumber = (value, locale) => {
    if (value === null || value === undefined) return "—";
    try {
        return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(value);
    } catch {
        return String(value);
    }
};

const Dashboard = () => {
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
        fetch(`${API_URL}${Urls.user.stats}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (cancelled) return;
                if (!res.ok) {
                    toast.error(tRef.current("dashboard.loadError"));
                    setLoadState("error");
                    return;
                }
                const data = await res.json();
                setStats(data);
                setLoadState("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("dashboard.stats", err);
                toast.error(tRef.current("dashboard.loadError"));
                setLoadState("error");
            });
        return () => {
            cancelled = true;
        };
    }, [sessionStatus, token]);

    if (loadState === "loading") {
        return (
            <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("dashboard.loading")}
            </div>
        );
    }

    if (loadState === "error" || !stats) {
        return (
            <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                {t("dashboard.loadError")}
            </div>
        );
    }

    const totals = stats.totals || {};
    const series = (stats.series || []).map((b) => ({
        ...b,
        label: shortDate(b.date, locale),
    }));
    const recentArticles = stats.recentArticles || [];

    const kpis = [
        {
            key: "articles",
            icon: FileText,
            iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            value: totals.articles ?? 0,
        },
        {
            key: "words",
            icon: Sparkles,
            iconBg: "bg-blue-100 dark:bg-blue-950/40",
            iconColor: "text-blue-600 dark:text-blue-400",
            value: formatCompactNumber(totals.wordsTotal ?? 0, locale),
        },
        {
            key: "seoScore",
            icon: TrendingUp,
            iconBg: "bg-amber-100 dark:bg-amber-950/40",
            iconColor: "text-amber-600 dark:text-amber-400",
            value: totals.seoAverage === null || totals.seoAverage === undefined
                ? t("dashboard.stats.noSeo")
                : `${totals.seoAverage}%`,
        },
        {
            key: "lastActivity",
            icon: Calendar,
            iconBg: "bg-slate-100 dark:bg-slate-800",
            iconColor: "text-slate-600 dark:text-slate-300",
            value: totals.lastActivity
                ? longDate(totals.lastActivity, locale)
                : t("dashboard.stats.noActivity"),
        },
    ];

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("dashboard.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("dashboard.subtitle")}</p>
                </div>

                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <div
                                key={kpi.key}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        {t(`dashboard.stats.${kpi.key}`)}
                                    </span>
                                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpi.iconBg}`}>
                                        <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                                    </span>
                                </div>
                                <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                    {kpi.value}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.weekActivity.title")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.weekActivity.description", { days: stats.windowDays })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={series} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="dashboardArticlesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                                    <Area
                                        type="monotone"
                                        dataKey="articles"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fill="url(#dashboardArticlesGrad)"
                                        name={t("dashboard.weekActivity.legend")}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.wordsChart.title")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.wordsChart.description", { days: stats.windowDays })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={series} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                                    <Line
                                        type="monotone"
                                        dataKey="words"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        dot={false}
                                        name={t("dashboard.wordsChart.legend")}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t("dashboard.recent.title")}</CardTitle>
                            <CardDescription>{t("dashboard.recent.description")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentArticles.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                    {t("dashboard.recent.empty")}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentArticles.map((article) => {
                                        const statusLabelKey = `dashboard.recent.status.${article.status}`;
                                        const statusFallback = `history.status.${article.status}`;
                                        const labelTry = t(statusLabelKey);
                                        const statusLabel = labelTry === statusLabelKey ? t(statusFallback) : labelTry;
                                        return (
                                            <Link
                                                key={article.id}
                                                href={`/editor/${article.id}`}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                            >
                                                <div className="min-w-0 space-y-1">
                                                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{article.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <span>{longDate(article.updatedAt, locale)}</span>
                                                        <span aria-hidden>•</span>
                                                        <span className={STATUS_COLOR[article.status] || "text-slate-500"}>{statusLabel}</span>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                            {t("dashboard.recent.seoScoreLabel")}
                                                        </p>
                                                        <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {article.seoScore === null || article.seoScore === undefined ? "—" : `${article.seoScore}%`}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
                            <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button asChild className="w-full justify-start" variant="outline">
                                <Link href="/ideas">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.ideas")}
                                </Link>
                            </Button>
                            <Button asChild className="w-full justify-start">
                                <Link href="/editor">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.newArticle")}
                                </Link>
                            </Button>
                            <Button asChild className="w-full justify-start" variant="outline">
                                <Link href="/history">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.history")}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
