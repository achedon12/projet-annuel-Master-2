"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    FileText,
    TrendingUp,
    Calendar,
    Sparkles,
    ArrowRight,
    Loader2,
    PenSquare,
    Lightbulb,
    History,
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
import { Button } from "@/components/Button";
import { PageShell, PageHeader, StatCard, SectionCard, EmptyState, StatusBadge } from "@/components/ui-kit";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const STATUS_VARIANT = {
    published: "published",
    draft: "draft",
    review: "review",
    archived: "archived",
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

const firstName = (fullName) => {
    if (!fullName || typeof fullName !== "string") return "";
    return fullName.trim().split(/\s+/)[0] || "";
};

const Dashboard = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const [stats, setStats] = useState(null);
    const [loadState, setLoadState] = useState("loading");

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;
    const userFirstName = firstName(session?.user?.name);

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
            .catch(() => {
                if (cancelled) return;
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

    const greetingTitle = userFirstName
        ? t("dashboard.greeting", { name: userFirstName })
        : t("dashboard.greetingGeneric");

    const kpis = [
        {
            key: "articles",
            icon: FileText,
            tone: "emerald",
            value: totals.articles ?? 0,
        },
        {
            key: "words",
            icon: Sparkles,
            tone: "blue",
            value: formatCompactNumber(totals.wordsTotal ?? 0, locale),
        },
        {
            key: "seoScore",
            icon: TrendingUp,
            tone: "amber",
            value:
                totals.seoAverage === null || totals.seoAverage === undefined
                    ? t("dashboard.stats.noSeo")
                    : `${totals.seoAverage}%`,
        },
        {
            key: "lastActivity",
            icon: Calendar,
            tone: "slate",
            value: totals.lastActivity
                ? longDate(totals.lastActivity, locale)
                : t("dashboard.stats.noActivity"),
        },
    ];

    return (
        <PageShell>
            <PageHeader
                eyebrow={t("dashboard.eyebrow")}
                title={greetingTitle}
                description={t("dashboard.subtitle")}
                actions={
                    <>
                        <Button asChild variant="outline" className="rounded-lg">
                            <Link href="/ideas">
                                <Lightbulb className="mr-2 h-4 w-4" />
                                {t("dashboard.quickActions.ideas")}
                            </Link>
                        </Button>
                        <Button asChild className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                            <Link href="/editor">
                                <PenSquare className="mr-2 h-4 w-4" />
                                {t("dashboard.quickActions.newArticle")}
                            </Link>
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <StatCard
                        key={kpi.key}
                        label={t(`dashboard.stats.${kpi.key}`)}
                        value={kpi.value}
                        icon={kpi.icon}
                        tone={kpi.tone}
                    />
                ))}
            </div>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                <SectionCard
                    title={t("dashboard.weekActivity.title")}
                    description={t("dashboard.weekActivity.description", { days: stats.windowDays })}
                    padding="md"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={series} margin={{ left: -16, right: 8, top: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dashboardArticlesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                            <XAxis dataKey="label" stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ stroke: "#10b981", strokeOpacity: 0.2 }}
                                contentStyle={{
                                    borderRadius: 12,
                                    fontSize: 12,
                                    border: "1px solid rgb(226 232 240)",
                                    background: "white",
                                    boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
                                }}
                            />
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
                </SectionCard>

                <SectionCard
                    title={t("dashboard.wordsChart.title")}
                    description={t("dashboard.wordsChart.description", { days: stats.windowDays })}
                    padding="md"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={series} margin={{ left: -16, right: 8, top: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                            <XAxis dataKey="label" stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ stroke: "#64748b", strokeOpacity: 0.2 }}
                                contentStyle={{
                                    borderRadius: 12,
                                    fontSize: 12,
                                    border: "1px solid rgb(226 232 240)",
                                    background: "white",
                                    boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="words"
                                stroke="#475569"
                                strokeWidth={2.5}
                                dot={false}
                                name={t("dashboard.wordsChart.legend")}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </SectionCard>
            </div>

            <SectionCard
                title={t("dashboard.recent.title")}
                description={t("dashboard.recent.description")}
                actions={
                    <Button asChild variant="ghost" size="sm" className="rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
                        <Link href="/history">
                            <History className="mr-2 h-4 w-4" />
                            {t("dashboard.quickActions.history")}
                        </Link>
                    </Button>
                }
                padding="md"
            >
                {recentArticles.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title={t("dashboard.recent.emptyTitle")}
                        description={t("dashboard.recent.empty")}
                        action={
                            <Button asChild className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                                <Link href="/editor">
                                    <PenSquare className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.newArticle")}
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentArticles.map((article) => {
                            const statusLabel = t(`dashboard.recent.status.${article.status}`);
                            const variant = STATUS_VARIANT[article.status] || "draft";
                            return (
                                <li key={article.id}>
                                    <Link
                                        href={`/editor/${article.id}`}
                                        className="group flex items-center justify-between gap-4 rounded-xl px-3 py-3.5 -mx-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {article.title}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <StatusBadge variant={variant}>{statusLabel}</StatusBadge>
                                                <span aria-hidden>•</span>
                                                <span>{longDate(article.updatedAt, locale)}</span>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    {t("dashboard.recent.seoScoreLabel")}
                                                </p>
                                                <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {article.seoScore === null || article.seoScore === undefined
                                                        ? "—"
                                                        : `${article.seoScore}%`}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-slate-600 dark:group-hover:text-emerald-400" />
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </SectionCard>
        </PageShell>
    );
};

export default Dashboard;
