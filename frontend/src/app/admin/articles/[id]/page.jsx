"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
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
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
    Panel,
    PanelBody,
    PanelHeader,
    LoadingState,
    ErrorState,
    EmptyState,
    StatusPill,
} from "@/components/admin/AdminUI";
import { API_URL, Urls } from "@/utils/Api";

const formatDate = (iso, locale) => {
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

const MetaRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{value}</span>
    </div>
);

const AdminArticleDetailInner = ({ articleId }) => {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [article, setArticle] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const tRef = useRef(t);
    tRef.current = t;
    const token = session?.backendToken;

    const fetchArticle = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const res = await fetch(`${API_URL}${Urls.admin.article(articleId)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 404) {
                setLoadState("notfound");
                return;
            }
            if (!res.ok) {
                toast.error(tRef.current("admin.toast.loadError"));
                setLoadState("error");
                return;
            }
            const data = await res.json();
            setArticle(data);
            setLoadState("ready");
        } catch (err) {
            console.error("admin.article.detail.fetch", err);
            toast.error(tRef.current("admin.toast.loadError"));
            setLoadState("error");
        }
    }, [token, articleId]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            fetchArticle();
        }
    }, [sessionStatus, fetchArticle]);

    const handleDelete = async () => {
        if (!token) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.admin.article(articleId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                toast.error(t("admin.articles.deleteError"));
                return;
            }
            toast.success(t("admin.articles.deleteSuccess"));
            router.push("/admin/articles");
        } catch (err) {
            console.error("admin.article.detail.delete", err);
            toast.error(t("admin.articles.deleteError"));
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    const statusLabel = (s) => {
        if (!s) return "";
        const key = `history.status.${s}`;
        const v = t(key);
        return v === key ? s : v;
    };

    const headerActions = (
        <>
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/articles">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    {t("admin.articles.detail.back")}
                </Link>
            </Button>
            {article && (
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                    onClick={() => setConfirmDelete(true)}
                >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t("admin.articles.detail.delete")}
                </Button>
            )}
        </>
    );

    return (
        <>
            <AdminPageHeader
                breadcrumb={[
                    { label: t("admin.nav.articles"), href: "/admin/articles" },
                    { label: article?.title || t("admin.articles.detail.title") },
                ]}
                title={article?.title || t("admin.articles.detail.title")}
                description={article?.author ? `${article.author.name} · ${article.author.email}` : undefined}
                actions={headerActions}
            />

            {loadState === "loading" ? (
                <LoadingState />
            ) : loadState === "notfound" ? (
                <EmptyState label={t("admin.articles.detail.notFound")} />
            ) : loadState === "error" || !article ? (
                <ErrorState />
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-2">
                        <PanelHeader title={t("admin.articles.detail.contentTitle")} />
                        <PanelBody>
                            <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                                {article.content || (
                                    <p className="text-slate-500 dark:text-slate-400 italic">
                                        {t("admin.articles.detail.noContent")}
                                    </p>
                                )}
                            </div>
                        </PanelBody>
                    </Panel>

                    <Panel>
                        <PanelHeader title={t("admin.articles.detail.metaTitle")} />
                        <PanelBody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="flex items-center justify-between py-2.5 text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t("admin.articles.table.status")}</span>
                                <StatusPill status={article.status}>{statusLabel(article.status)}</StatusPill>
                            </div>
                            {article.tone && <MetaRow label={t("admin.articles.detail.tone")} value={article.tone} />}
                            {article.audience && <MetaRow label={t("admin.articles.detail.audience")} value={article.audience} />}
                            {article.type && <MetaRow label={t("admin.articles.detail.type")} value={article.type} />}
                            <MetaRow label={t("admin.articles.detail.wordCount")} value={article.wordCount ?? "—"} />
                            <MetaRow label={t("admin.articles.detail.seoScore")} value={article.seoScore ?? "—"} />
                            <MetaRow label={t("admin.articles.table.createdAt")} value={formatDate(article.createdAt, locale)} />
                            <MetaRow label={t("admin.articles.detail.updatedAt")} value={formatDate(article.updatedAt, locale)} />
                            {article.publishedAt && (
                                <MetaRow label={t("admin.articles.detail.publishedAt")} value={formatDate(article.publishedAt, locale)} />
                            )}
                        </PanelBody>
                    </Panel>
                </div>
            )}

            <AlertDialog
                open={confirmDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) setConfirmDelete(false);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.articles.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("admin.articles.deleteConfirm")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("admin.articles.deleteCancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("admin.articles.deleting")}
                                </>
                            ) : (
                                t("admin.articles.deleteOk")
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

const AdminArticleDetailPage = ({ params }) => {
    const resolved = use(params);
    return <AdminArticleDetailInner articleId={resolved.id} />;
};

export default AdminArticleDetailPage;
