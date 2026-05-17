"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Sparkles,
    Save,
    Eye,
    Send,
    RotateCcw,
    Wand2,
    FileText,
    TrendingUp,
    Share2,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Separator } from "@/components/Separator";
import { Progress } from "@/components/Progress";
import { Slider } from "@/components/Slider";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";
import { analyzeSeo, exportArticleAsMarkdown, exportArticleAsPdf } from "@/utils/articleSeo";

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);

const verdictBadgeVariant = (verdict) =>
    verdict === "good" ? "default" : verdict === "fair" ? "secondary" : "outline";
const verdictLabelKey = (verdict) =>
    verdict === "good" ? "common.good" : verdict === "fair" ? "common.needsImprovement" : "common.needsImprovement";

/**
 * Éditeur d'article : pilote la création (initialArticle=null) et l'édition (initialArticle=object).
 * Persiste via POST /api/articles (create) ou PUT /api/articles/{id} (update).
 */
export const ArticleEditor = ({ initialArticle = null, articleId = null }) => {
    const { t, locale } = useTranslation();
    const { data: session } = useSession();
    const router = useRouter();

    const [title, setTitle] = useState(initialArticle?.title ?? "");
    const [content, setContent] = useState(initialArticle?.content ?? "");
    const [wordCount, setWordCount] = useState(
        initialArticle?.wordCount ?? countWords(initialArticle?.content ?? ""),
    );
    const [targetWords, setTargetWords] = useState([800]);
    const [tone, setTone] = useState(initialArticle?.tone ?? "");
    const [audience, setAudience] = useState(initialArticle?.audience ?? "");
    const [status, setStatus] = useState(initialArticle?.status ?? "draft");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [activeAction, setActiveAction] = useState(null); // 'improve-style' | 'add-intro' | 'optimize-seo' | null
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const token = session?.backendToken;

    const handleContentChange = (value) => {
        setContent(value);
        setWordCount(countWords(value));
    };

    const buildPayload = () => ({
        title: title.trim(),
        content,
        tone: tone || null,
        audience: audience || null,
        status,
    });

    const persistArticle = async ({ publish = false } = {}) => {
        if (!token) {
            toast.error(t("editor.toast.saveError"));
            return null;
        }
        if (title.trim().length < 2) {
            toast.error(t("editor.toast.titleRequired"));
            return null;
        }

        const payload = buildPayload();
        const url = articleId ? `${API_URL}${Urls.articles.one(articleId)}` : `${API_URL}${Urls.articles.list}`;
        const method = articleId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const message = await extractError(res, t(publish ? "editor.toast.publishError" : "editor.toast.saveError"));
                toast.error(message);
                return null;
            }
            const saved = await res.json();
            return saved;
        } catch (err) {
            console.error("article.save", err);
            toast.error(t("editor.toast.saveError"));
            return null;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const saved = await persistArticle();
        setIsSaving(false);
        if (!saved) return;
        toast.success(t("editor.toast.saved"));
        if (!articleId && saved.id) {
            router.push(`/editor/${saved.id}`);
            router.refresh();
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        const saved = await persistArticle({ publish: true });
        if (!saved) {
            setIsPublishing(false);
            return;
        }
        const targetId = saved.id;

        try {
            const res = await fetch(`${API_URL}${Urls.articles.publish(targetId)}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const message = await extractError(res, t("editor.toast.publishError"));
                toast.error(message);
                return;
            }
            const published = await res.json();
            setStatus(published.status);
            toast.success(t("editor.toast.published"));
            if (!articleId) {
                router.push(`/editor/${targetId}`);
                router.refresh();
            }
        } catch (err) {
            console.error("article.publish", err);
            toast.error(t("editor.toast.publishError"));
        } finally {
            setIsPublishing(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!token) {
            toast.error(t("editor.toast.generateError"));
            return;
        }
        if (title.trim().length < 2) {
            toast.error(t("editor.toast.titleRequired"));
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}${Urls.articles.generateContent}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    tone: tone || null,
                    audience: audience || null,
                    targetWords: targetWords[0],
                    locale,
                }),
            });
            if (!res.ok) {
                const message = await extractError(res, t("editor.toast.generateError"));
                toast.error(message);
                return;
            }
            const data = await res.json();
            if (typeof data?.content === "string") {
                setContent(data.content);
                setWordCount(typeof data.wordCount === "number" ? data.wordCount : countWords(data.content));
                toast.success(t("editor.toast.generated"));
            } else {
                toast.error(t("editor.toast.generateError"));
            }
        } catch (err) {
            console.error("article.generate", err);
            toast.error(t("editor.toast.generateError"));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAiAction = async (action) => {
        if (!token) {
            toast.error(t("editor.toast.generateError"));
            return;
        }
        if (title.trim().length < 2) {
            toast.error(t("editor.toast.titleRequired"));
            return;
        }
        if (!content.trim()) {
            toast.error(t("editor.toast.contentRequired"));
            return;
        }
        setActiveAction(action);
        try {
            const res = await fetch(`${API_URL}${Urls.articles.aiAction}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action,
                    title: title.trim(),
                    content,
                    tone: tone || null,
                    audience: audience || null,
                    locale,
                }),
            });
            const toastKey = action.replace(/-/g, "");
            if (!res.ok) {
                const message = await extractError(res, t(`editor.toast.${toastKey}Error`));
                toast.error(message);
                return;
            }
            const data = await res.json();
            if (typeof data?.content === "string") {
                setContent(data.content);
                setWordCount(typeof data.wordCount === "number" ? data.wordCount : countWords(data.content));
                toast.success(t(`editor.toast.${toastKey}Success`));
            } else {
                toast.error(t(`editor.toast.${toastKey}Error`));
            }
        } catch (err) {
            console.error("article.ai-action", action, err);
            toast.error(t("editor.toast.generateError"));
        } finally {
            setActiveAction(null);
        }
    };

    const handleLoadSuggestions = async () => {
        if (!token) return;
        if (title.trim().length < 2) {
            toast.error(t("editor.toast.titleRequired"));
            return;
        }
        setIsLoadingSuggestions(true);
        try {
            const res = await fetch(`${API_URL}${Urls.articles.aiAction}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: "suggestions",
                    title: title.trim(),
                    content,
                    locale,
                }),
            });
            if (!res.ok) {
                const message = await extractError(res, t("editor.toast.suggestionsError"));
                toast.error(message);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
            } else {
                toast.error(t("editor.toast.suggestionsError"));
            }
        } catch (err) {
            console.error("article.suggestions", err);
            toast.error(t("editor.toast.suggestionsError"));
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleExportMarkdown = () => {
        if (!content.trim() && !title.trim()) {
            toast.error(t("editor.toast.exportEmpty"));
            return;
        }
        try {
            exportArticleAsMarkdown(title, content);
            toast.success(t("editor.toast.exportMd"));
        } catch (err) {
            console.error("article.export.md", err);
            toast.error(t("editor.toast.exportError"));
        }
    };

    const handleExportPdf = async () => {
        if (!content.trim() && !title.trim()) {
            toast.error(t("editor.toast.exportEmpty"));
            return;
        }
        setIsExportingPdf(true);
        try {
            await exportArticleAsPdf(title, content);
            toast.success(t("editor.toast.exportPdf"));
        } catch (err) {
            console.error("article.export.pdf", err);
            toast.error(t("editor.toast.exportError"));
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportNotion = () => {
        toast.info(t("editor.toast.notionSoon"));
    };

    const handleRewrite = async () => {
        if (!token || !content.trim()) {
            return;
        }
        setIsRewriting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.articles.rewrite}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    paragraph: content,
                    tone: tone || null,
                    locale,
                }),
            });
            if (!res.ok) {
                const message = await extractError(res, t("editor.toast.rewriteError"));
                toast.error(message);
                return;
            }
            const data = await res.json();
            if (typeof data?.paragraph === "string") {
                setContent(data.paragraph);
                setWordCount(countWords(data.paragraph));
                toast.success(t("editor.toast.rewritten"));
            } else {
                toast.error(t("editor.toast.rewriteError"));
            }
        } catch (err) {
            console.error("article.rewrite", err);
            toast.error(t("editor.toast.rewriteError"));
        } finally {
            setIsRewriting(false);
        }
    };

    const seoAnalysis = useMemo(
        () => analyzeSeo({ title, content, targetWords: targetWords[0] }),
        [title, content, targetWords],
    );
    const statusLabelKey = `history.status.${status}`;
    const statusLabel = (() => {
        const translated = t(statusLabelKey);
        return translated === statusLabelKey ? status : translated;
    })();
    const isAnyAiActionRunning =
        activeAction !== null || isGenerating || isRewriting || isLoadingSuggestions;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl">{t("editor.title")}</h1>
                            <Badge variant="secondary">{t("editor.wordCount", { count: wordCount })}</Badge>
                            <Badge variant="outline">{statusLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleSave} disabled={isSaving || isPublishing}>
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {t("editor.save")}
                            </Button>
                            <Button variant="outline" disabled>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("editor.preview")}
                            </Button>
                            <Button onClick={handlePublish} disabled={isSaving || isPublishing}>
                                {isPublishing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {t("editor.publish")}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-auto p-6">
                        <div className="mx-auto max-w-4xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("editor.basicInfo")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">{t("editor.articleTitle")}</Label>
                                        <Input
                                            id="title"
                                            placeholder={t("editor.articleTitlePlaceholder")}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            maxLength={255}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">{t("editor.tone")}</Label>
                                            <Select value={tone} onValueChange={setTone}>
                                                <SelectTrigger id="tone">
                                                    <SelectValue placeholder={t("editor.tonePlaceholder")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">{t("editor.tones.professional")}</SelectItem>
                                                    <SelectItem value="casual">{t("editor.tones.casual")}</SelectItem>
                                                    <SelectItem value="friendly">{t("editor.tones.friendly")}</SelectItem>
                                                    <SelectItem value="formal">{t("editor.tones.formal")}</SelectItem>
                                                    <SelectItem value="enthusiastic">{t("editor.tones.enthusiastic")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="audience-editor">{t("editor.audience")}</Label>
                                            <Select value={audience} onValueChange={setAudience}>
                                                <SelectTrigger id="audience-editor">
                                                    <SelectValue placeholder={t("editor.audiencePlaceholder")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="beginners">{t("editor.audiences.beginners")}</SelectItem>
                                                    <SelectItem value="intermediate">{t("editor.audiences.intermediate")}</SelectItem>
                                                    <SelectItem value="experts">{t("editor.audiences.experts")}</SelectItem>
                                                    <SelectItem value="general">{t("editor.audiences.general")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{t("editor.content")}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRewrite}
                                                disabled={isAnyAiActionRunning || !content}
                                            >
                                                {isRewriting ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                )}
                                                {t("editor.rewrite")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleGenerateContent}
                                                disabled={isAnyAiActionRunning || title.trim().length < 2}
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        {t("editor.generating")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        {t("editor.generateAi")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder={t("editor.contentPlaceholder")}
                                        value={content}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                        rows={20}
                                        className="font-mono text-sm"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="w-80 overflow-auto border-l dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                        <Tabs defaultValue="ai" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="ai">{t("editor.tabs.ai")}</TabsTrigger>
                                <TabsTrigger value="seo">{t("editor.tabs.seo")}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="ai" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{t("editor.aiConfig")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">{t("editor.targetWords")}</Label>
                                                <span className="text-sm">{targetWords[0]}</span>
                                            </div>
                                            <Slider
                                                value={targetWords}
                                                onValueChange={setTargetWords}
                                                min={200}
                                                max={3000}
                                                step={100}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <Label className="text-sm">{t("editor.quickActions")}</Label>
                                            <div className="space-y-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => handleAiAction("improve-style")}
                                                    disabled={isAnyAiActionRunning || !content.trim() || title.trim().length < 2}
                                                >
                                                    {activeAction === "improve-style" ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Wand2 className="mr-2 h-4 w-4" />
                                                    )}
                                                    {t("editor.improveStyle")}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => handleAiAction("add-intro")}
                                                    disabled={isAnyAiActionRunning || !content.trim() || title.trim().length < 2}
                                                >
                                                    {activeAction === "add-intro" ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <FileText className="mr-2 h-4 w-4" />
                                                    )}
                                                    {t("editor.addIntro")}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => handleAiAction("optimize-seo")}
                                                    disabled={isAnyAiActionRunning || !content.trim() || title.trim().length < 2}
                                                >
                                                    {activeAction === "optimize-seo" ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <TrendingUp className="mr-2 h-4 w-4" />
                                                    )}
                                                    {t("editor.optimizeSeo")}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-base">{t("editor.suggestionsTitle")}</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleLoadSuggestions}
                                                disabled={isLoadingSuggestions || title.trim().length < 2 || isAnyAiActionRunning}
                                            >
                                                {isLoadingSuggestions ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                )}
                                                {t("editor.suggestionsRefresh")}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {suggestions.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {t("editor.suggestionsEmpty")}
                                            </p>
                                        ) : (
                                            <div className="space-y-3 text-sm">
                                                {suggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3">
                                                        <p className="text-slate-600 dark:text-slate-300">{suggestion}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="seo" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{t("editor.seo.scoreTitle")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t("editor.seo.global")}</span>
                                                <span className="text-2xl text-emerald-600">{seoAnalysis.score}%</span>
                                            </div>
                                            <Progress value={seoAnalysis.score} className="h-2" />
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{t("editor.seo.contentLength")}</span>
                                                <Badge variant={verdictBadgeVariant(seoAnalysis.checks.contentLength)}>
                                                    {t(verdictLabelKey(seoAnalysis.checks.contentLength))}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{t("editor.seo.optimizedTitle")}</span>
                                                <Badge variant={verdictBadgeVariant(seoAnalysis.checks.optimizedTitle)}>
                                                    {t(verdictLabelKey(seoAnalysis.checks.optimizedTitle))}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{t("editor.seo.structure")}</span>
                                                <Badge variant={verdictBadgeVariant(seoAnalysis.checks.structure)}>
                                                    {t(verdictLabelKey(seoAnalysis.checks.structure))}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{t("editor.seo.keywords")}</span>
                                                <Badge variant={verdictBadgeVariant(seoAnalysis.checks.keywords)}>
                                                    {t(verdictLabelKey(seoAnalysis.checks.keywords))}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{t("editor.seo.detected")}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {seoAnalysis.keywords.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {t("editor.seo.detectedEmpty")}
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {seoAnalysis.keywords.map((kw) => (
                                                    <Badge key={kw} variant="outline">{kw}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{t("editor.export.title")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={handleExportPdf}
                                            disabled={isExportingPdf}
                                        >
                                            {isExportingPdf ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Share2 className="mr-2 h-4 w-4" />
                                            )}
                                            {t("editor.export.pdf")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={handleExportMarkdown}
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {t("editor.export.markdown")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={handleExportNotion}
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {t("editor.export.notion")}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
};

const extractError = async (response, fallback) => {
    try {
        const data = await response.json();
        if (data?.error && typeof data.error === "string") {
            return data.error;
        }
    } catch {
        // body non JSON — fallback générique
    }
    return fallback;
};
