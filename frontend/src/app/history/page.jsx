"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
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
    Search,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Download,
    Share2,
    Calendar,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const publications = [
    {
        id: 1,
        title: "Guide complet du SEO technique en 2026",
        type: "Article de blog",
        status: "Publié",
        publishedDate: new Date(2026, 2, 5),
        wordCount: 2450,
        seoScore: 92,
        views: 1247,
        engagement: 8.5,
        notionSynced: true,
    },
    {
        id: 2,
        title: "10 stratégies de content marketing",
        type: "Article de blog",
        status: "Brouillon",
        publishedDate: new Date(2026, 2, 4),
        wordCount: 1850,
        seoScore: 85,
        views: 0,
        engagement: 0,
        notionSynced: false,
    },
    {
        id: 3,
        title: "L'IA dans la création de contenu",
        type: "Guide",
        status: "En révision",
        publishedDate: new Date(2026, 2, 3),
        wordCount: 3200,
        seoScore: 88,
        views: 0,
        engagement: 0,
        notionSynced: true,
    },
    {
        id: 4,
        title: "Optimiser vos meta descriptions pour le CTR",
        type: "Tutoriel",
        status: "Publié",
        publishedDate: new Date(2026, 2, 1),
        wordCount: 1450,
        seoScore: 90,
        views: 856,
        engagement: 7.2,
        notionSynced: true,
    },
    {
        id: 5,
        title: "Les tendances SEO 2026",
        type: "Article de blog",
        status: "Publié",
        publishedDate: new Date(2026, 1, 28),
        wordCount: 2100,
        seoScore: 94,
        views: 2134,
        engagement: 9.1,
        notionSynced: true,
    },
    {
        id: 6,
        title: "Comment créer un calendrier éditorial",
        type: "Guide",
        status: "Archivé",
        publishedDate: new Date(2026, 1, 15),
        wordCount: 1900,
        seoScore: 87,
        views: 423,
        engagement: 6.8,
        notionSynced: false,
    },
];

const statusColors = {
    Publié: "default",
    Brouillon: "secondary",
    "En révision": "outline",
    Archivé: "secondary",
};

const PublicationsHistory = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    const filteredPublications = publications.filter((pub) => {
        const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || pub.status === filterStatus;
        const matchesType = filterType === "all" || pub.type === filterType;
        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = {
        total: publications.length,
        published: publications.filter((p) => p.status === "Publié").length,
        draft: publications.filter((p) => p.status === "Brouillon").length,
        archived: publications.filter((p) => p.status === "Archivé").length,
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">Historique des publications</h1>
                    <p className="text-slate-600">Gérez et suivez tous vos contenus</p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Publiés</CardDescription>
                            <CardTitle className="text-3xl text-emerald-600">{stats.published}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Brouillons</CardDescription>
                            <CardTitle className="text-3xl text-amber-600">{stats.draft}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Archivés</CardDescription>
                            <CardTitle className="text-3xl text-slate-600">{stats.archived}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Tous les contenus</CardTitle>
                                <CardDescription>
                                    {filteredPublications.length} résultat(s)
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative flex-1 md:w-64 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les statuts</SelectItem>
                                        <SelectItem value="Publié">Publié</SelectItem>
                                        <SelectItem value="Brouillon">Brouillon</SelectItem>
                                        <SelectItem value="En révision">En révision</SelectItem>
                                        <SelectItem value="Archivé">Archivé</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les types</SelectItem>
                                        <SelectItem value="Article de blog">Article</SelectItem>
                                        <SelectItem value="Guide">Guide</SelectItem>
                                        <SelectItem value="Tutoriel">Tutoriel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="list" className="w-full">
                            <TabsList>
                                <TabsTrigger value="list">Liste</TabsTrigger>
                                <TabsTrigger value="calendar">Calendrier</TabsTrigger>
                            </TabsList>

                            <TabsContent value="list" className="space-y-4">
                                <div className="space-y-3">
                                    {filteredPublications.map((pub) => (
                                        <div
                                            key={pub.id}
                                            className="flex items-center justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                                        >
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-medium">{pub.title}</h3>
                                                    <Badge variant={statusColors[pub.status]}>
                                                        {pub.status}
                                                    </Badge>
                                                    {pub.notionSynced && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Synchro Notion
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                    <span>{pub.type}</span>
                                                    <span>•</span>
                                                    <span>
                            {format(pub.publishedDate, "d MMMM yyyy", { locale: fr })}
                          </span>
                                                    <span>•</span>
                                                    <span>{pub.wordCount} mots</span>
                                                    {pub.status === "Publié" && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                                                {pub.views} vues
                              </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                                                {pub.engagement}% engagement
                              </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Score SEO</p>
                                                    <p className="text-lg text-emerald-600">{pub.seoScore}%</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Exporter
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Share2 className="mr-2 h-4 w-4" />
                                                            Partager
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="calendar">
                                <div className="rounded-lg border bg-white p-8 text-center">
                                    <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                                    <h3 className="mb-2 text-lg">Vue calendrier</h3>
                                    <p className="text-sm text-slate-600">
                                        Visualisez vos publications dans un calendrier éditorial
                                    </p>
                                    <p className="mt-4 text-xs text-slate-500">
                                        Cette fonctionnalité sera bientôt disponible
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default PublicationsHistory;