"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
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
    FileText,
    CheckCircle2,
    PencilLine,
    Archive,
    FileSearch,
} from "lucide-react";
import { format } from "date-fns";
import { fr as dateFr, enUS as dateEn } from "date-fns/locale";
import { toast } from "sonner";
import { PageShell, PageHeader, StatCard, SectionCard, EmptyState, StatusBadge } from "@/components/ui-kit";
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

const STATUS_BADGE_VARIANT = {
    [STATUS_KEYS.PUBLISHED]: "published",
    [STATUS_KEYS.DRAFT]: "draft",
    [STATUS_KEYS.REVIEW]: "review",
    [STATUS_KEYS.ARCHIVED]: "archived",
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
        <PageShell>
            <PageHeader
                eyebrow={t("history.eyebrow")}
                title={t("history.title")}
                description={t("history.subtitle")}
                actions={
                    <Button
                        onClick={() => router.push("/editor")}
                        className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("history.newArticle")}
                    </Button>
                }
            />

            <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
                <StatCard label={t("history.stats.total")} value={stats.total} icon={FileText} tone="slate" />
                <StatCard label={t("history.stats.published")} value={stats.published} icon={CheckCircle2} tone="emerald" />
                <StatCard label={t("history.stats.drafts")} value={stats.draft} icon={PencilLine} tone="amber" />
                <StatCard label={t("history.stats.archived")} value={stats.archived} icon={Archive} tone="slate" />
            </div>

            <SectionCard
                title={t("history.all")}
                description={t("history.resultsCount", { count: filteredArticles.length })}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                placeholder={t("history.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
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
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4 text-slate-400 dark:text-slate-500" />
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
                }
                padding="md"
            >
                <Tabs defaultValue="list" className="w-full">
                    <TabsList>
                        <TabsTrigger value="list">{t("history.tabs.list")}</TabsTrigger>
                        <TabsTrigger value="calendar">{t("history.tabs.calendar")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-4">
                        {loadState === "loading" ? (
                            <div className="flex items-center justify-center py-12 text-sm text-slate-500 dark:text-slate-400">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("history.loading")}
                            </div>
                        ) : loadState === "error" ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                                {t("history.loadError")}
                            </div>
                        ) : articles.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title={t("history.emptyTitle")}
                                description={t("history.empty")}
                                action={
                                    <Button
                                        onClick={() => router.push("/editor")}
                                        className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t("history.newArticle")}
                                    </Button>
                                }
                            />
                        ) : filteredArticles.length === 0 ? (
                            <EmptyState
                                icon={FileSearch}
                                title={t("history.noMatchTitle")}
                                description={t("history.noMatch")}
                            />
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredArticles.map((article) => (
                                    <li
                                        key={article.id}
                                        className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/editor/${article.id}`)}
                                            className="group min-w-0 flex-1 text-left"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                                                    {article.title}
                                                </h3>
                                                <StatusBadge variant={STATUS_BADGE_VARIANT[article.status] || "draft"}>
                                                    {statusLabel(article.status)}
                                                </StatusBadge>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                {article.type && (
                                                    <>
                                                        <span>{typeLabel(article.type)}</span>
                                                        <span aria-hidden>•</span>
                                                    </>
                                                )}
                                                <span>{formatDate(article.publishedAt || article.updatedAt)}</span>
                                                <span aria-hidden>•</span>
                                                <span>{t("history.wordsCount", { count: article.wordCount || 0 })}</span>
                                            </div>
                                        </button>
                                        <div className="flex shrink-0 items-center gap-4">
                                            {typeof article.seoScore === "number" && (
                                                <div className="hidden text-right sm:block">
                                                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        {t("history.seoScoreLabel")}
                                                    </p>
                                                    <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {article.seoScore}%
                                                    </p>
                                                </div>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-lg">
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
                                                        className="text-red-600 dark:text-red-400"
                                                        onClick={() => setPendingDeleteId(article.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t("history.actions.delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-4">
                        <EmptyState
                            icon={Calendar}
                            title={t("history.calendar.title")}
                            description={t("history.calendar.description")}
                            footer={t("history.calendar.soon")}
                        />
                    </TabsContent>
                </Tabs>
            </SectionCard>

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
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
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
        </PageShell>
    );
};

export default PublicationsHistory;
