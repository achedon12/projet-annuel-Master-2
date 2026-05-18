"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp, Lightbulb, Search } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PageShell, PageHeader, SectionCard, EmptyState, StatusBadge } from "@/components/ui-kit";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const DIFFICULTY = {
    EASY: "easy",
    MEDIUM: "medium",
    ADVANCED: "advanced",
};

const DIFFICULTY_VARIANT = {
    [DIFFICULTY.EASY]: "easy",
    [DIFFICULTY.MEDIUM]: "medium",
    [DIFFICULTY.ADVANCED]: "hard",
};

const IdeaGenerator = () => {
    const { t, locale } = useTranslation();
    const { data: session } = useSession();
    const [keyword, setKeyword] = useState("");
    const [audience, setAudience] = useState("");
    const [contentType, setContentType] = useState("");
    const [ideas, setIdeas] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length < 2) {
            toast.error(t("ideas.toast.errorMissingKeyword"));
            return;
        }
        if (!session?.backendToken) {
            toast.error(t("ideas.toast.errorNetwork"));
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}${Urls.ideas.generate}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.backendToken}`,
                },
                body: JSON.stringify({
                    keyword: trimmedKeyword,
                    contentType: contentType || undefined,
                    audience: audience.trim() || undefined,
                    locale,
                }),
            });

            if (!res.ok) {
                let message = t("ideas.toast.errorGeneration");
                try {
                    const data = await res.json();
                    if (data?.error && typeof data.error === "string") {
                        message = data.error;
                    }
                } catch {
                    // body non JSON — message générique conservé
                }
                toast.error(message);
                return;
            }

            const data = await res.json();
            const list = Array.isArray(data?.ideas) ? data.ideas : [];
            setIdeas(list);
            if (list.length === 0) {
                toast.error(t("ideas.toast.errorGeneration"));
            } else {
                toast.success(t("ideas.toast.generated"));
            }
        } catch (err) {
            console.error("ideas.generate", err);
            toast.error(t("ideas.toast.errorNetwork"));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (title) => {
        navigator.clipboard.writeText(title);
        toast.success(t("ideas.toast.copied"));
    };

    const difficultyLabel = (d) => {
        const key = `ideas.difficulty.${d}`;
        const translated = t(key);
        return translated === key ? d : translated;
    };

    return (
        <PageShell>
            <PageHeader
                eyebrow={t("ideas.eyebrow")}
                title={t("ideas.title")}
                description={t("ideas.subtitle")}
                icon={<Lightbulb className="h-5 w-5" />}
            />

            <SectionCard
                title={t("ideas.configTitle")}
                description={t("ideas.configDescription")}
                padding="md"
            >
                <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="keyword">{t("ideas.mainKeyword")}</Label>
                            <Input
                                id="keyword"
                                placeholder={t("ideas.mainKeywordPlaceholder")}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                maxLength={120}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content-type">{t("ideas.contentType")}</Label>
                            <Select value={contentType} onValueChange={setContentType}>
                                <SelectTrigger id="content-type">
                                    <SelectValue placeholder={t("ideas.contentTypePlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="blog">{t("ideas.types.blog")}</SelectItem>
                                    <SelectItem value="guide">{t("ideas.types.guide")}</SelectItem>
                                    <SelectItem value="listicle">{t("ideas.types.listicle")}</SelectItem>
                                    <SelectItem value="tutorial">{t("ideas.types.tutorial")}</SelectItem>
                                    <SelectItem value="case-study">{t("ideas.types.caseStudy")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="audience">{t("ideas.audience")}</Label>
                        <Textarea
                            id="audience"
                            placeholder={t("ideas.audiencePlaceholder")}
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || keyword.trim().length < 2}
                            className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {t("ideas.generating")}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t("ideas.generate")}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </SectionCard>

            {ideas.length === 0 ? (
                <EmptyState
                    icon={Sparkles}
                    title={t("ideas.emptyTitle")}
                    description={t("ideas.empty")}
                />
            ) : (
                <SectionCard
                    title={t("ideas.suggestionsTitle")}
                    description={t("ideas.ideasCount", { count: ideas.length })}
                    padding="md"
                >
                    <div className="grid gap-4">
                        {ideas.map((idea, index) => (
                            <article
                                key={index}
                                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {idea.title}
                                        </h3>
                                        {idea.description && (
                                            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                {idea.description}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(idea.title)}
                                        className="rounded-lg shrink-0"
                                        aria-label={t("ideas.actions.copy")}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>

                                {(idea.keywords || []).length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {idea.keywords.map((kw, kIndex) => (
                                            <span
                                                key={kIndex}
                                                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {idea.difficulty && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium">{t("ideas.difficultyLabel")}</span>
                                                <StatusBadge variant={DIFFICULTY_VARIANT[idea.difficulty] || "neutral"}>
                                                    {difficultyLabel(idea.difficulty)}
                                                </StatusBadge>
                                            </div>
                                        )}
                                        {idea.volume && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="font-medium">{t("ideas.volumeLabel")}</span>
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    {t("ideas.volumeMonth", { value: idea.volume })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="rounded-lg" aria-label={t("ideas.actions.like")}>
                                            <ThumbsUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-lg" aria-label={t("ideas.actions.dislike")}>
                                            <ThumbsDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </SectionCard>
            )}
        </PageShell>
    );
};

export default IdeaGenerator;
