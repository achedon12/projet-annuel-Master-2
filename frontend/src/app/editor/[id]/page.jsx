"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { API_URL, Urls } from "@/utils/Api";
import { useTranslation } from "@/hooks/useI18n";

const EditorEditPage = ({ params }) => {
    // Next 16 : params est une Promise, on la déballe avec React.use().
    const { id } = use(params);
    const articleId = Number(id);
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [loadState, setLoadState] = useState("loading");

    // Ref stable sur t : t change d'identité à chaque render, on l'isole
    // du useEffect pour éviter de re-fetch l'article à chaque re-render.
    const tRef = useRef(t);
    tRef.current = t;

    useEffect(() => {
        if (status !== "authenticated" || !session?.backendToken) return;
        if (!Number.isInteger(articleId) || articleId <= 0) {
            setLoadState("notfound");
            return;
        }
        let cancelled = false;
        setLoadState("loading");
        fetch(`${API_URL}${Urls.articles.one(articleId)}`, {
            headers: { Authorization: `Bearer ${session.backendToken}` },
        })
            .then(async (res) => {
                if (cancelled) return;
                if (res.status === 404) {
                    setLoadState("notfound");
                    return;
                }
                if (!res.ok) {
                    toast.error(tRef.current("editor.toast.loadError"));
                    setLoadState("error");
                    return;
                }
                const data = await res.json();
                setArticle(data);
                setLoadState("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("article.load", err);
                toast.error(tRef.current("editor.toast.loadError"));
                setLoadState("error");
            });
        return () => {
            cancelled = true;
        };
    }, [articleId, session?.backendToken, status]);

    if (loadState === "loading") {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("editor.toast.loading")}
            </div>
        );
    }

    if (loadState === "notfound") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 px-6 text-center">
                <p className="text-lg text-slate-700 dark:text-slate-200">{t("editor.toast.notFound")}</p>
                <button
                    type="button"
                    className="text-sm text-emerald-600 hover:underline"
                    onClick={() => router.push("/history")}
                >
                    {t("editor.toast.backToHistory")}
                </button>
            </div>
        );
    }

    if (loadState === "error" || !article) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                {t("editor.toast.loadError")}
            </div>
        );
    }

    return <ArticleEditor initialArticle={article} articleId={articleId} />;
};

export default EditorEditPage;
