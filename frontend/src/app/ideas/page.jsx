"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Label } from "@/components/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const DIFFICULTY = {
    EASY: "easy",
    MEDIUM: "medium",
    ADVANCED: "advanced",
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

    const difficultyColor = (d) =>
        d === DIFFICULTY.EASY
            ? "text-emerald-600"
            : d === DIFFICULTY.MEDIUM
                ? "text-amber-600"
                : "text-red-600";

    const difficultyLabel = (d) => {
        const key = `ideas.difficulty.${d}`;
        const translated = t(key);
        return translated === key ? d : translated;
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("ideas.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("ideas.subtitle")}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("ideas.configTitle")}</CardTitle>
                        <CardDescription>{t("ideas.configDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
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

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || keyword.trim().length < 2}
                            className="w-full md:w-auto"
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
                    </CardContent>
                </Card>

                {ideas.length === 0 ? (
                    <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("ideas.empty")}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl">{t("ideas.suggestionsTitle")}</h2>
                            <Badge variant="secondary">{t("ideas.ideasCount", { count: ideas.length })}</Badge>
                        </div>

                        <div className="grid gap-6">
                            {ideas.map((idea, index) => (
                                <Card key={index} className="transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <CardTitle className="text-xl">{idea.title}</CardTitle>
                                                <CardDescription>{idea.description}</CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleCopy(idea.title)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(idea.keywords || []).map((kw, kIndex) => (
                                                    <Badge key={kIndex} variant="outline">
                                                        {kw}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="ml-auto flex items-center gap-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">{t("ideas.difficultyLabel")}</span>{" "}
                                                    <span className={difficultyColor(idea.difficulty)}>
                                                        {difficultyLabel(idea.difficulty)}
                                                    </span>
                                                </div>
                                                {idea.volume && (
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                                        <span className="font-medium">{t("ideas.volumeLabel")}</span>{" "}
                                                        {t("ideas.volumeMonth", { value: idea.volume })}
                                                    </div>
                                                )}
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon">
                                                        <ThumbsUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <ThumbsDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdeaGenerator;
