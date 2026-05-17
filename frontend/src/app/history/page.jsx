"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu";
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Download,
    Share2,
    Calendar,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr as dateFr, enUS as dateEn } from "date-fns/locale";
import { useTranslation } from "@/hooks/useI18n";

const STATUS_KEYS = {
    PUBLISHED: "published",
    DRAFT: "draft",
    REVIEW: "review",
    ARCHIVED: "archived",
};

const TYPE_KEYS = {
    BLOG: "blog",
    GUIDE: "guide",
    TUTORIAL: "tutorial",
};

const publications = [
    {
        id: 1,
        titleKey: "history.items.seoTechnical",
        type: TYPE_KEYS.BLOG,
        status: STATUS_KEYS.PUBLISHED,
        publishedDate: new Date(2026, 2, 5),
        wordCount: 2450,
        seoScore: 92,
        views: 1247,
        engagement: 8.5,
        notionSynced: true,
    },
    {
        id: 2,
        titleKey: "history.items.tenStrategies",
        type: TYPE_KEYS.BLOG,
        status: STATUS_KEYS.DRAFT,
        publishedDate: new Date(2026, 2, 4),
        wordCount: 1850,
        seoScore: 85,
        views: 0,
        engagement: 0,
        notionSynced: false,
    },
    {
        id: 3,
        titleKey: "history.items.aiInContent",
        type: TYPE_KEYS.GUIDE,
        status: STATUS_KEYS.REVIEW,
        publishedDate: new Date(2026, 2, 3),
        wordCount: 3200,
        seoScore: 88,
        views: 0,
        engagement: 0,
        notionSynced: true,
    },
    {
        id: 4,
        titleKey: "history.items.metaDesc",
        type: TYPE_KEYS.TUTORIAL,
        status: STATUS_KEYS.PUBLISHED,
        publishedDate: new Date(2026, 2, 1),
        wordCount: 1450,
        seoScore: 90,
        views: 856,
        engagement: 7.2,
        notionSynced: true,
    },
    {
        id: 5,
        titleKey: "history.items.trends2026",
        type: TYPE_KEYS.BLOG,
        status: STATUS_KEYS.PUBLISHED,
        publishedDate: new Date(2026, 1, 28),
        wordCount: 2100,
        seoScore: 94,
        views: 2134,
        engagement: 9.1,
        notionSynced: true,
    },
    {
        id: 6,
        titleKey: "history.items.editorialCalendar",
        type: TYPE_KEYS.GUIDE,
        status: STATUS_KEYS.ARCHIVED,
        publishedDate: new Date(2026, 1, 15),
        wordCount: 1900,
        seoScore: 87,
        views: 423,
        engagement: 6.8,
        notionSynced: false,
    },
];

const statusBadgeVariant = {
    [STATUS_KEYS.PUBLISHED]: "default",
    [STATUS_KEYS.DRAFT]: "secondary",
    [STATUS_KEYS.REVIEW]: "outline",
    [STATUS_KEYS.ARCHIVED]: "secondary",
};

const PublicationsHistory = () => {
    const { t, locale } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    const filteredPublications = publications.filter((pub) => {
        const title = t(pub.titleKey).toLowerCase();
        const matchesSearch = title.includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || pub.status === filterStatus;
        const matchesType = filterType === "all" || pub.type === filterType;
        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = {
        total: publications.length,
        published: publications.filter((p) => p.status === STATUS_KEYS.PUBLISHED).length,
        draft: publications.filter((p) => p.status === STATUS_KEYS.DRAFT).length,
        archived: publications.filter((p) => p.status === STATUS_KEYS.ARCHIVED).length,
    };

    const dateLocale = locale === "en" ? dateEn : dateFr;

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("history.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("history.subtitle")}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>{t("history.stats.total")}</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>{t("history.stats.published")}</CardDescription>
                            <CardTitle className="text-3xl text-emerald-600">{stats.published}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>{t("history.stats.drafts")}</CardDescription>
                            <CardTitle className="text-3xl text-amber-600">{stats.draft}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>{t("history.stats.archived")}</CardDescription>
                            <CardTitle className="text-3xl text-slate-600 dark:text-slate-300">{stats.archived}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>{t("history.all")}</CardTitle>
                                <CardDescription>
                                    {t("history.resultsCount", { count: filteredPublications.length })}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative flex-1 md:w-64 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        placeholder={t("history.searchPlaceholder")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("history.filters.allStatus")}</SelectItem>
                                        <SelectItem value={STATUS_KEYS.PUBLISHED}>{t("history.status.published")}</SelectItem>
                                        <SelectItem value={STATUS_KEYS.DRAFT}>{t("history.status.draft")}</SelectItem>
                                        <SelectItem value={STATUS_KEYS.REVIEW}>{t("history.status.review")}</SelectItem>
                                        <SelectItem value={STATUS_KEYS.ARCHIVED}>{t("history.status.archived")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("history.filters.allTypes")}</SelectItem>
                                        <SelectItem value={TYPE_KEYS.BLOG}>{t("history.type.article")}</SelectItem>
                                        <SelectItem value={TYPE_KEYS.GUIDE}>{t("history.type.guide")}</SelectItem>
                                        <SelectItem value={TYPE_KEYS.TUTORIAL}>{t("history.type.tutorial")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="list" className="w-full">
                            <TabsList>
                                <TabsTrigger value="list">{t("history.tabs.list")}</TabsTrigger>
                                <TabsTrigger value="calendar">{t("history.tabs.calendar")}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="list" className="space-y-4">
                                <div className="space-y-3">
                                    {filteredPublications.map((pub) => (
                                        <div
                                            key={pub.id}
                                            className="flex items-center justify-between rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-shadow hover:shadow-md"
                                        >
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-medium">{t(pub.titleKey)}</h3>
                                                    <Badge variant={statusBadgeVariant[pub.status]}>
                                                        {t(`history.status.${pub.status}`)}
                                                    </Badge>
                                                    {pub.notionSynced && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {t("history.notionSynced")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <span>{t(`history.type.${pub.type}`)}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {format(pub.publishedDate, "d MMMM yyyy", { locale: dateLocale })}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{t("history.wordsCount", { count: pub.wordCount })}</span>
                                                    {pub.status === STATUS_KEYS.PUBLISHED && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {t("history.views", { count: pub.views })}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="h-3 w-3" />
                                                                {t("history.engagement", { value: pub.engagement })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t("history.seoScoreLabel")}</p>
                                                    <p className="text-lg text-emerald-600">{pub.seoScore}%</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t("history.actions.view")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {t("history.actions.edit")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            {t("history.actions.export")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Share2 className="mr-2 h-4 w-4" />
                                                            {t("history.actions.share")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {t("history.actions.delete")}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="calendar">
                                <div className="rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                                    <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />
                                    <h3 className="mb-2 text-lg">{t("history.calendar.title")}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("history.calendar.description")}</p>
                                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t("history.calendar.soon")}</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PublicationsHistory;
