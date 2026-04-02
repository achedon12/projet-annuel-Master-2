"use client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/Card";
import { Button } from "@/components/Button";
import {
    FileText,
    TrendingUp,
    Calendar,
    Sparkles,
    ArrowRight,
} from "lucide-react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Link from "next/link";

const stats = [
    {
        title: "Articles générés",
        value: "24",
        change: "+12%",
        trend: "up",
        icon: FileText,
    },
    {
        title: "Mots générés",
        value: "45.2K",
        change: "+23%",
        trend: "up",
        icon: Sparkles,
    },
    {
        title: "Score SEO moyen",
        value: "87%",
        change: "+5%",
        trend: "up",
        icon: TrendingUp,
    },
    {
        title: "Dernière synchronisation",
        value: "2j",
        change: "",
        trend: "up",
        icon: Calendar,
    },
];

const activityData = [
    { name: "Lun", articles: 2, mots: 1200 },
    { name: "Mar", articles: 3, mots: 2100 },
    { name: "Mer", articles: 1, mots: 800 },
    { name: "Jeu", articles: 4, mots: 3200 },
    { name: "Ven", articles: 2, mots: 1600 },
    { name: "Sam", articles: 1, mots: 500 },
    { name: "Dim", articles: 0, mots: 0 },
];

const recentArticles = [
    {
        title: "Guide complet du SEO technique en 2026",
        status: "Publié",
        date: "5 mars 2026",
        score: 92,
    },
    {
        title: "10 stratégies de content marketing",
        status: "Brouillon",
        date: "4 mars 2026",
        score: 85,
    },
    {
        title: "L'IA dans la création de contenu",
        status: "En révision",
        date: "3 mars 2026",
        score: 88,
    },
];

const Dashboard = () => {
    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">
                        Bienvenue sur SEO Content AI
                    </h1>
                    <p className="text-slate-600">
                        Voici un aperçu de votre activité
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl">{stat.value}</div>
                                    <p className="text-xs text-emerald-600">
                                        {stat.change} ce mois
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activité de la semaine</CardTitle>
                            <CardDescription>
                                Nombre d'articles créés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="articles"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Mots générés</CardTitle>
                            <CardDescription>
                                Volume de contenu par jour
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="mots"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Articles récents</CardTitle>
                            <CardDescription>
                                Vos derniers contenus créés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentArticles.map((article, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {article.title}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span>{article.date}</span>
                                                <span>•</span>
                                                <span
                                                    className={
                                                        article.status === "Publié"
                                                            ? "text-emerald-600"
                                                            : article.status === "Brouillon"
                                                                ? "text-slate-500"
                                                                : "text-amber-600"
                                                    }
                                                >
                          {article.status}
                        </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">
                                                    Score SEO
                                                </p>
                                                <p className="text-lg text-emerald-600">
                                                    {article.score}%
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions rapides</CardTitle>
                            <CardDescription>
                                Créez du contenu optimisé
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/ideas">
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Générer des idées
                                </Button>
                            </Link>
                            <Link href="/editor">
                                <Button className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Nouvel article
                                </Button>
                            </Link>
                            <Link href="/history">
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Voir l'historique
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;