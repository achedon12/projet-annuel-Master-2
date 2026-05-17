"use client"
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
import Link from "next/link";
import { useTranslation } from "@/hooks/useI18n";

const Dashboard = () => {
    const { t } = useTranslation();

    const stats = [
        { titleKey: "dashboard.stats.articles", value: "24", change: "+12%", trend: "up", icon: FileText },
        { titleKey: "dashboard.stats.words", value: "45.2K", change: "+23%", trend: "up", icon: Sparkles },
        { titleKey: "dashboard.stats.seoScore", value: "87%", change: "+5%", trend: "up", icon: TrendingUp },
        { titleKey: "dashboard.stats.lastSync", value: t("dashboard.stats.lastSyncValue"), change: "", trend: "up", icon: Calendar },
    ];

    const activityData = [
        { name: t("dashboard.weekdays.mon"), articles: 2, mots: 1200 },
        { name: t("dashboard.weekdays.tue"), articles: 3, mots: 2100 },
        { name: t("dashboard.weekdays.wed"), articles: 1, mots: 800 },
        { name: t("dashboard.weekdays.thu"), articles: 4, mots: 3200 },
        { name: t("dashboard.weekdays.fri"), articles: 2, mots: 1600 },
        { name: t("dashboard.weekdays.sat"), articles: 1, mots: 500 },
        { name: t("dashboard.weekdays.sun"), articles: 0, mots: 0 },
    ];

    const recentArticles = [
        { titleKey: "dashboard.articles.seoTechnical", statusKey: "dashboard.articles.published", date: "2026-03-05", score: 92 },
        { titleKey: "dashboard.articles.tenStrategies", statusKey: "dashboard.articles.draft", date: "2026-03-04", score: 85 },
        { titleKey: "dashboard.articles.aiInContent", statusKey: "dashboard.articles.review", date: "2026-03-03", score: 88 },
    ];

    const statusColor = (key) =>
        key === "dashboard.articles.published"
            ? "text-emerald-600 dark:text-emerald-400"
            : key === "dashboard.articles.draft"
                ? "text-slate-500 dark:text-slate-400"
                : "text-amber-600 dark:text-amber-400";

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("dashboard.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("dashboard.subtitle")}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.titleKey}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm">{t(stat.titleKey)}</CardTitle>
                                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl">{stat.value}</div>
                                    {stat.change && (
                                        <p className="text-xs text-emerald-600">
                                            {t("dashboard.stats.changeNote", { change: stat.change })}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.weekActivity.title")}</CardTitle>
                            <CardDescription>{t("dashboard.weekActivity.description")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="articles"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.wordsChart.title")}</CardTitle>
                            <CardDescription>{t("dashboard.wordsChart.description")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="mots"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
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
                            <div className="space-y-4">
                                {recentArticles.map((article, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border dark:border-slate-800 p-4"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">{t(article.titleKey)}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <span>{article.date}</span>
                                                <span>•</span>
                                                <span className={statusColor(article.statusKey)}>
                                                    {t(article.statusKey)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.recent.seoScoreLabel")}</p>
                                                <p className="text-lg text-emerald-600">{article.score}%</p>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
                            <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/ideas">
                                <Button className="w-full justify-start" variant="outline">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.ideas")}
                                </Button>
                            </Link>
                            <Link href="/editor">
                                <Button className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.newArticle")}
                                </Button>
                            </Link>
                            <Link href="/history">
                                <Button className="w-full justify-start" variant="outline">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {t("dashboard.quickActions.history")}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
