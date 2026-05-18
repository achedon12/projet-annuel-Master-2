"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
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
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";
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

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl">{t("admin.articles.detail.title")}</h1>
                </div>

                <AdminNav />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/articles">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            {t("admin.articles.detail.back")}
                        </Link>
                    </Button>
                    {article && (
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            {t("admin.articles.detail.delete")}
                        </Button>
                    )}
                </div>

                {loadState === "loading" ? (
                    <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("admin.toast.loading")}
                    </div>
                ) : loadState === "notfound" ? (
                    <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("admin.articles.detail.notFound")}
                    </div>
                ) : loadState === "error" || !article ? (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                        {t("admin.toast.loadError")}
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>{article.title}</CardTitle>
                                {article.author && (
                                    <CardDescription>
                                        {article.author.name} · {article.author.email}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                                    {article.content || (
                                        <p className="text-slate-500 dark:text-slate-400 italic">
                                            {t("admin.articles.detail.noContent")}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("admin.articles.detail.metaTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.table.status")}</span>
                                    <Badge variant="secondary">{article.status}</Badge>
                                </div>
                                {article.tone && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.tone")}</span>
                                        <span>{article.tone}</span>
                                    </div>
                                )}
                                {article.audience && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.audience")}</span>
                                        <span>{article.audience}</span>
                                    </div>
                                )}
                                {article.type && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.type")}</span>
                                        <span>{article.type}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.wordCount")}</span>
                                    <span>{article.wordCount ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.seoScore")}</span>
                                    <span>{article.seoScore ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.table.createdAt")}</span>
                                    <span>{formatDate(article.createdAt, locale)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.updatedAt")}</span>
                                    <span>{formatDate(article.updatedAt, locale)}</span>
                                </div>
                                {article.publishedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t("admin.articles.detail.publishedAt")}</span>
                                        <span>{formatDate(article.publishedAt, locale)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

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
        </div>
    );
};

const AdminArticleDetailPage = ({ params }) => {
    const resolved = use(params);
    return (
        <AdminGuard>
            <AdminArticleDetailInner articleId={resolved.id} />
        </AdminGuard>
    );
};

export default AdminArticleDetailPage;
