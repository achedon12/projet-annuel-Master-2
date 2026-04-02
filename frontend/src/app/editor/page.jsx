"use client";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import {Badge} from "@/components/Badge";
import {Button} from "@/components/Button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/Card";
import * as PropTypes from "prop-types";
import {Input} from "@/components/Input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/Select";
import {Textarea} from "@/components/Textarea";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/Tabs";
import {Separator} from "@/components/Separator";
import {Progress} from "@/components/Progress";
import {Slider} from "@/components/Slider";

function Label(props) {
    return null;
}

Label.propTypes = {
    htmlFor: PropTypes.string,
    children: PropTypes.node
};
const ContentEditor = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [targetWords, setTargetWords] = useState([800]);
    const [tone, setTone] = useState("");
    const [audience, setAudience] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleContentChange = (value) => {
        setContent(value);
        setWordCount(value.trim().split(/\s+/).filter(Boolean).length);
    };

    const handleGenerateContent = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const generatedContent = `# ${title || "Titre de l'article"}

## Introduction

L'optimisation pour les moteurs de recherche (SEO) est devenue un élément crucial de toute stratégie de marketing digital. Dans cet article, nous explorerons les meilleures pratiques et stratégies pour améliorer votre visibilité en ligne.

## Les fondamentaux du SEO

Le SEO repose sur trois piliers principaux :

1. **Contenu de qualité** : Créer du contenu pertinent et engageant
2. **Technique** : Optimiser la structure et la performance du site
3. **Popularité** : Développer l'autorité et les backlinks

### Création de contenu optimisé

Pour créer du contenu qui performe bien dans les moteurs de recherche, il est essentiel de :

- Comprendre l'intention de recherche de votre audience
- Utiliser des mots-clés pertinents de manière naturelle
- Structurer votre contenu avec des titres et sous-titres clairs
- Fournir de la valeur ajoutée et des informations uniques

## Conclusion

L'optimisation SEO est un processus continu qui nécessite de la patience et de la persévérance. En appliquant ces stratégies, vous améliorerez progressivement votre positionnement dans les résultats de recherche.`;

            setContent(generatedContent);
            setWordCount(generatedContent.trim().split(/\s+/).filter(Boolean).length);
            setIsGenerating(false);
            toast.success("Contenu généré avec succès !");
        }, 3000);
    };

    const handleRewrite = () => {
        toast.success("Paragraphe reformulé avec succès !");
    };

    const handleSave = () => {
        toast.success("Article sauvegardé en brouillon");
    };

    const handlePublish = () => {
        toast.success("Article publié et synchronisé avec Notion");
    };

    const seoScore = Math.min(100, Math.round((wordCount / targetWords[0]) * 85 + 15));

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl">Éditeur de contenu</h1>
                            <Badge variant="secondary">{wordCount} mots</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Sauvegarder
                            </Button>
                            <Button variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                Prévisualiser
                            </Button>
                            <Button onClick={handlePublish}>
                                <Send className="mr-2 h-4 w-4" />
                                Publier
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-auto p-6">
                        <div className="mx-auto max-w-4xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informations de base</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Titre de l'article</Label>
                                        <Input
                                            id="title"
                                            placeholder="Entrez le titre de votre article..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Ton de voix</Label>
                                            <Select value={tone} onValueChange={setTone}>
                                                <SelectTrigger id="tone">
                                                    <SelectValue placeholder="Sélectionner un ton" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professionnel</SelectItem>
                                                    <SelectItem value="casual">Décontracté</SelectItem>
                                                    <SelectItem value="friendly">Amical</SelectItem>
                                                    <SelectItem value="formal">Formel</SelectItem>
                                                    <SelectItem value="enthusiastic">Enthousiaste</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="audience-editor">Audience cible</Label>
                                            <Select value={audience} onValueChange={setAudience}>
                                                <SelectTrigger id="audience-editor">
                                                    <SelectValue placeholder="Sélectionner l'audience" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="beginners">Débutants</SelectItem>
                                                    <SelectItem value="intermediate">Intermédiaires</SelectItem>
                                                    <SelectItem value="experts">Experts</SelectItem>
                                                    <SelectItem value="general">Grand public</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Contenu</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRewrite}
                                                disabled={!content}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Reformuler
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleGenerateContent}
                                                disabled={isGenerating || !title}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {isGenerating ? "Génération..." : "Générer avec IA"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Commencez à écrire ou utilisez l'IA pour générer du contenu..."
                                        value={content}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                        rows={20}
                                        className="font-mono text-sm"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="w-80 overflow-auto border-l bg-white p-6">
                        <Tabs defaultValue="ai" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="ai">Assistant IA</TabsTrigger>
                                <TabsTrigger value="seo">SEO</TabsTrigger>
                            </TabsList>

                            <TabsContent value="ai" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Configuration IA</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">Nombre de mots cible</Label>
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
                                            <Label className="text-sm">Actions rapides</Label>
                                            <div className="space-y-2">
                                                <Button variant="outline" size="sm" className="w-full justify-start">
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    Améliorer le style
                                                </Button>
                                                <Button variant="outline" size="sm" className="w-full justify-start">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Ajouter une intro
                                                </Button>
                                                <Button variant="outline" size="sm" className="w-full justify-start">
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    Optimiser SEO
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Suggestions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm">
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-slate-600">
                                                    Ajoutez une section sur les tendances 2026 pour améliorer la pertinence
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-slate-600">
                                                    Incluez des exemples concrets pour illustrer vos points
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-slate-600">
                                                    Ajoutez des statistiques récentes pour renforcer vos arguments
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="seo" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Score SEO</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Score global</span>
                                                <span className="text-2xl text-emerald-600">{seoScore}%</span>
                                            </div>
                                            <Progress value={seoScore} className="h-2" />
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Longueur du contenu</span>
                                                <Badge variant={wordCount >= targetWords[0] * 0.8 ? "default" : "secondary"}>
                                                    {wordCount >= targetWords[0] * 0.8 ? "Bon" : "À améliorer"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Titre optimisé</span>
                                                <Badge variant={title.length > 30 ? "default" : "secondary"}>
                                                    {title.length > 30 ? "Bon" : "À améliorer"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Structure</span>
                                                <Badge variant="default">Bon</Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Mots-clés</span>
                                                <Badge variant="secondary">À améliorer</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Mots-clés détectés</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline">SEO</Badge>
                                            <Badge variant="outline">contenu</Badge>
                                            <Badge variant="outline">optimisation</Badge>
                                            <Badge variant="outline">marketing</Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Export</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Exporter en PDF
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Exporter en Markdown
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Envoyer à Notion
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
}

export default ContentEditor;