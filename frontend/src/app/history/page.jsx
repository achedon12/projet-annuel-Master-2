"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/AlertDialog";
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
    Loader2,
    Plus,
} from "lucide-react";
import { format } from "date-fns";
import { fr as dateFr, enUS as dateEn } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

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

const statusBadgeVariant = {
    [STATUS_KEYS.PUBLISHED]: "default",
    [STATUS_KEYS.DRAFT]: "secondary",
    [STATUS_KEYS.REVIEW]: "outline",
    [STATUS_KEYS.ARCHIVED]: "secondary",
};

const PublicationsHistory = () => {
    const { t, locale } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();

    const [articles, setArticles] = useState([]);
    const [loadState, setLoadState] = useState("loading");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const token = session?.backendToken;

    // Ref stable sur t : t change d'identité à chaque render (useTranslation ne mémoïse pas),
    // donc on l'isole d'un useCallback pour éviter une boucle de fetch.
    const tRef = useRef(t);
    tRef.current = t;

    const fetchArticles = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const res = await fetch(`${API_URL}${Urls.articles.list}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast.error(tRef.current("history.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setArticles(Array.isArray(data?.items) ? data.items : []);
            setLoadState("ready");
        } catch (err) {
            console.error("history.fetch", err);
            toast.error(tRef.current("history.loadError"));
            setLoadState("error");
        }
    }, [token]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchArticles();
        }
    }, [sessionStatus, fetchArticles]);

    const handleDelete = async () => {
        if (!pendingDeleteId || !token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.articles.one(pendingDeleteId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                toast.error(t("history.deleteError"));
                return;
            }
            setArticles((prev) => prev.filter((a) => a.id !== pendingDeleteId));
            toast.success(t("history.deleteSuccess"));
        } catch (err) {
            console.error("history.delete", err);
            toast.error(t("history.deleteError"));
        } finally {
            setIsDeleting(false);
            setPendingDeleteId(null);
        }
    };

    const filteredArticles = useMemo(() => {
        const needle = searchQuery.toLowerCase();
        return articles.filter((article) => {
            const title = (article.title || "").toLowerCase();
            const matchesSearch = needle === "" || title.includes(needle);
            const matchesStatus = filterStatus === "all" || article.status === filterStatus;
            const matchesType = filterType === "all" || article.type === filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [articles, searchQuery, filterStatus, filterType]);

    const stats = useMemo(() => ({
        total: articles.length,
        published: articles.filter((a) => a.status === STATUS_KEYS.PUBLISHED).length,
        draft: articles.filter((a) => a.status === STATUS_KEYS.DRAFT).length,
        archived: articles.filter((a) => a.status === STATUS_KEYS.ARCHIVED).length,
    }), [articles]);

    const dateLocale = locale === "en" ? dateEn : dateFr;

    const formatDate = (iso) => {
        if (!iso) return "—";
        try {
            return format(new Date(iso), "d MMMM yyyy", { locale: dateLocale });
        } catch {
            return iso;
        }
    };

    const typeLabel = (type) => {
        if (!type) return "—";
        const key = `history.type.${type}`;
        const translated = t(key);
        return translated === key ? type : translated;
    };

    const statusLabel = (statusValue) => {
        const key = `history.status.${statusValue}`;
        const translated = t(key);
        return translated === key ? statusValue : translated;
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl">{t("history.title")}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{t("history.subtitle")}</p>
                    </div>
                    <Button onClick={() => router.push("/editor")}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("history.newArticle")}
                    </Button>
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
                                    {t("history.resultsCount", { count: filteredArticles.length })}
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
                                        <SelectItem value={TYPE_KEYS.BLOG}>{t("history.type.blog")}</SelectItem>
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
                                {loadState === "loading" ? (
                                    <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("history.loading")}
                                    </div>
                                ) : loadState === "error" ? (
                                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                                        {t("history.loadError")}
                                    </div>
                                ) : articles.length === 0 ? (
                                    <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                        {t("history.empty")}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredArticles.map((article) => (
                                            <div
                                                key={article.id}
                                                className="flex items-center justify-between rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-shadow hover:shadow-md"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-medium">{article.title}</h3>
                                                        <Badge variant={statusBadgeVariant[article.status] || "secondary"}>
                                                            {statusLabel(article.status)}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {article.type && (
                                                            <>
                                                                <span>{typeLabel(article.type)}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <span>
                                                            {formatDate(article.publishedAt || article.updatedAt)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{t("history.wordsCount", { count: article.wordCount || 0 })}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {typeof article.seoScore === "number" && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{t("history.seoScoreLabel")}</p>
                                                            <p className="text-lg text-emerald-600">{article.seoScore}%</p>
                                                        </div>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => router.push(`/editor/${article.id}`)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                {t("history.actions.view")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => router.push(`/editor/${article.id}`)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                {t("history.actions.edit")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem disabled>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                {t("history.actions.export")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem disabled>
                                                                <Share2 className="mr-2 h-4 w-4" />
                                                                {t("history.actions.share")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => setPendingDeleteId(article.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t("history.actions.delete")}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredArticles.length === 0 && (
                                            <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                                {t("history.noMatch")}
                                            </div>
                                        )}
                                    </div>
                                )}
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

            <AlertDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setPendingDeleteId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("history.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("history.deleteConfirm")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("history.deleteCancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("history.deleting")}
                                </>
                            ) : (
                                t("history.deleteOk")
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PublicationsHistory;
