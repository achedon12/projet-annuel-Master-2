"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import { Users, FileText, Lightbulb, Mail, Ban, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { API_URL, Urls } from "@/utils/Api";

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

const KPIS = [
    {
        key: "users",
        icon: Users,
        iconBg: "bg-blue-100 dark:bg-blue-950/40",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
        key: "articles",
        icon: FileText,
        iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
        key: "ideas",
        icon: Lightbulb,
        iconBg: "bg-amber-100 dark:bg-amber-950/40",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
        key: "mails",
        icon: Mail,
        iconBg: "bg-purple-100 dark:bg-purple-950/40",
        iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
        key: "bannedIps",
        icon: Ban,
        iconBg: "bg-red-100 dark:bg-red-950/40",
        iconColor: "text-red-600 dark:text-red-400",
    },
    {
        key: "loginEvents",
        icon: ShieldCheck,
        iconBg: "bg-slate-100 dark:bg-slate-800",
        iconColor: "text-slate-600 dark:text-slate-300",
    },
];

const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
        </p>
    </div>
);

const ChartCard = ({ title, hint, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <div className="h-64">{children}</div>
    </div>
);

const AdminDashboard = () => {
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
            <div className="flex h-64 items-center justify-center text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("admin.toast.loading")}
            </div>
        );
    }

    if (loadState === "error" || !stats) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {t("admin.toast.loadError")}
            </div>
        );
    }

    const seriesForChart = (rawSeries) =>
        rawSeries.map((bucket) => ({
            ...bucket,
            label: shortDate(bucket.date, locale),
        }));

    return (
        <>
            <AdminPageHeader
                title={t("admin.title")}
                description={t("admin.subtitle", { days: stats.windowDays })}
            />

            <section className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
                {KPIS.map((kpi) => (
                    <KpiCard
                        key={kpi.key}
                        icon={kpi.icon}
                        iconBg={kpi.iconBg}
                        iconColor={kpi.iconColor}
                        label={t(`admin.kpi.${kpi.key}`)}
                        value={stats.totals[kpi.key]}
                    />
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2 mb-8">
                <ChartCard
                    title={t("admin.charts.signups")}
                    hint={t("admin.charts.signupsHint", { days: stats.windowDays })}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={seriesForChart(stats.series.signups)} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={false}
                                name={t("admin.charts.signups")}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title={t("admin.charts.articlesPerDay")}
                    hint={t("admin.charts.articlesHint", { days: stats.windowDays })}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={seriesForChart(stats.series.articles)} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                            <defs>
                                <linearGradient id="articlesGrad" x1="0" y1="0" x2="0" y2="1">
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
                                dataKey="count"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fill="url(#articlesGrad)"
                                name={t("admin.charts.articlesPerDay")}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {t("admin.topAuthors.title")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t("admin.topAuthors.description")}
                    </p>
                </div>
                {stats.topAuthors.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("admin.topAuthors.empty")}
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stats.topAuthors.map((author, idx) => (
                            <li key={author.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {idx + 1}
                                    </span>
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={author.avatar || ""} alt={author.name} />
                                        <AvatarFallback>{initialsOf(author.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{author.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{author.email}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    {t("admin.topAuthors.articles", { count: author.articleCount })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
};

export default AdminDashboard;
