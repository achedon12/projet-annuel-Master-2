"use client";
import {useState} from "react";
import {Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp} from "lucide-react";
import {toast} from "sonner";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/Card";
import {Label} from "@/components/Label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/Select";
import {Textarea} from "@/components/Textarea";
import {Input} from "@/components/Input";
import {Button} from "@/components/Button";
import {Badge} from "@/components/Badge";

const mockIdeas = [
    {
        title: "Guide complet du SEO technique pour les débutants",
        description: "Un article détaillé couvrant les bases du SEO technique, incluant l'optimisation de la vitesse, le crawl budget, et la structure des URLs.",
        keywords: ["SEO technique", "optimisation", "crawl budget"],
        difficulty: "Facile",
        searchVolume: "2.4K/mois",
    },
    {
        title: "10 stratégies de content marketing qui fonctionnent en 2026",
        description: "Découvrez les tactiques éprouvées pour créer du contenu engageant et performant dans l'environnement digital actuel.",
        keywords: ["content marketing", "stratégie digitale", "engagement"],
        difficulty: "Moyen",
        searchVolume: "1.8K/mois",
    },
    {
        title: "L'impact de l'IA sur la création de contenu SEO",
        description: "Analyse approfondie de comment l'intelligence artificielle transforme les pratiques de création de contenu optimisé pour les moteurs de recherche.",
        keywords: ["IA", "SEO", "automatisation"],
        difficulty: "Avancé",
        searchVolume: "3.2K/mois",
    },
    {
        title: "Comment optimiser vos meta descriptions pour le CTR",
        description: "Guide pratique pour rédiger des meta descriptions qui augmentent votre taux de clics dans les résultats de recherche.",
        keywords: ["meta description", "CTR", "SERP"],
        difficulty: "Facile",
        searchVolume: "1.5K/mois",
    },
];

const IdeaGenerator = () => {
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
            toast.success("Idées générées avec succès !");
        }, 2000);
    };

    const handleCopy = (title) => {
        navigator.clipboard.writeText(title);
        toast.success("Titre copié dans le presse-papier");
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">Générateur d'idées</h1>
                    <p className="text-slate-600">Laissez l'IA vous suggérer des sujets pertinents</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuration de la génération</CardTitle>
                        <CardDescription>
                            Définissez vos paramètres pour obtenir des suggestions personnalisées
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="keyword">Mot-clé principal</Label>
                                <Input
                                    id="keyword"
                                    placeholder="Ex: SEO, content marketing, IA..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content-type">Type de contenu</Label>
                                <Select value={contentType} onValueChange={setContentType}>
                                    <SelectTrigger id="content-type">
                                        <SelectValue placeholder="Sélectionner un type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blog">Article de blog</SelectItem>
                                        <SelectItem value="guide">Guide complet</SelectItem>
                                        <SelectItem value="listicle">Liste</SelectItem>
                                        <SelectItem value="tutorial">Tutoriel</SelectItem>
                                        <SelectItem value="case-study">Étude de cas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="audience">Audience cible</Label>
                            <Textarea
                                id="audience"
                                placeholder="Décrivez votre audience cible (ex: professionnels du marketing digital, débutants en SEO...)"
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
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                                    Génération en cours...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4"/>
                                    Générer des idées
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {ideas.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl">Suggestions générées</h2>
                            <Badge variant="secondary">{ideas.length} idées</Badge>
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
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex flex-wrap gap-2">
                                                {idea.keywords.map((keyword, kIndex) => (
                                                    <Badge key={kIndex} variant="outline">
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="ml-auto flex items-center gap-4">
                                                <div className="text-sm text-slate-600">
                                                    <span className="font-medium">Difficulté:</span>{" "}
                                                    <span
                                                        className={
                                                            idea.difficulty === "Facile"
                                                                ? "text-emerald-600"
                                                                : idea.difficulty === "Moyen"
                                                                    ? "text-amber-600"
                                                                    : "text-red-600"
                                                        }
                                                    >
                                                        {idea.difficulty}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    <span className="font-medium">Volume:</span> {idea.searchVolume}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon">
                                                        <ThumbsUp className="h-4 w-4"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <ThumbsDown className="h-4 w-4"/>
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
}

export default IdeaGenerator;