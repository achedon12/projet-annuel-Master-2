"use client";
import { useState } from "react";
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

const DIFFICULTY = {
    EASY: "easy",
    MEDIUM: "medium",
    ADVANCED: "advanced",
};

const mockIdeas = [
    {
        titleKey: "ideas.mock.seoBeginners.title",
        descriptionKey: "ideas.mock.seoBeginners.description",
        keywords: ["SEO technique", "optimisation", "crawl budget"],
        difficulty: DIFFICULTY.EASY,
        volume: "2.4K",
    },
    {
        titleKey: "ideas.mock.tenStrategies.title",
        descriptionKey: "ideas.mock.tenStrategies.description",
        keywords: ["content marketing", "stratégie digitale", "engagement"],
        difficulty: DIFFICULTY.MEDIUM,
        volume: "1.8K",
    },
    {
        titleKey: "ideas.mock.aiImpact.title",
        descriptionKey: "ideas.mock.aiImpact.description",
        keywords: ["IA", "SEO", "automatisation"],
        difficulty: DIFFICULTY.ADVANCED,
        volume: "3.2K",
    },
    {
        titleKey: "ideas.mock.metaDesc.title",
        descriptionKey: "ideas.mock.metaDesc.description",
        keywords: ["meta description", "CTR", "SERP"],
        difficulty: DIFFICULTY.EASY,
        volume: "1.5K",
    },
];

const IdeaGenerator = () => {
    const { t } = useTranslation();
    const [keyword, setKeyword] = useState("");
    const [audience, setAudience] = useState("");
    const [contentType, setContentType] = useState("");
    const [ideas, setIdeas] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIdeas(mockIdeas);
            setIsGenerating(false);
            toast.success(t("ideas.toast.generated"));
        }, 2000);
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
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !keyword}
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

                {ideas.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl">{t("ideas.suggestionsTitle")}</h2>
                            <Badge variant="secondary">{t("ideas.ideasCount", { count: ideas.length })}</Badge>
                        </div>

                        <div className="grid gap-6">
                            {ideas.map((idea, index) => {
                                const title = t(idea.titleKey);
                                return (
                                    <Card key={index} className="transition-shadow hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <CardTitle className="text-xl">{title}</CardTitle>
                                                    <CardDescription>{t(idea.descriptionKey)}</CardDescription>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCopy(title)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {idea.keywords.map((kw, kIndex) => (
                                                        <Badge key={kIndex} variant="outline">
                                                            {kw}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="ml-auto flex items-center gap-4">
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                                        <span className="font-medium">{t("ideas.difficultyLabel")}</span>{" "}
                                                        <span className={difficultyColor(idea.difficulty)}>
                                                            {t(`ideas.difficulty.${idea.difficulty}`)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                                        <span className="font-medium">{t("ideas.volumeLabel")}</span>{" "}
                                                        {t("ideas.mock.volumeMonth", { value: idea.volume })}
                                                    </div>
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
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdeaGenerator;
