"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Separator } from "@/components/Separator";
import { Switch } from "@/components/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Badge } from "@/components/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import {
    User,
    Bell,
    Palette,
    Link as LinkIcon,
    Check,
    X,
    Mail,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
    const [notionConnected, setNotionConnected] = useState(true);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState(true);

    const handleSave = () => {
        toast.success("Paramètres sauvegardés avec succès");
    };

    const handleConnectNotion = () => {
        setNotionConnected(!notionConnected);
        toast.success(
            notionConnected ? "Déconnecté de Notion" : "Connecté à Notion avec succès"
        );
    };

    const handleConnectGoogle = () => {
        setGoogleConnected(!googleConnected);
        toast.success(
            googleConnected ? "Déconnecté de Google" : "Connecté à Google avec succès"
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <h1 className="text-3xl">Paramètres</h1>
                    <p className="text-slate-600">Gérez votre compte et vos préférences</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList>
                        <TabsTrigger value="profile">
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="integrations">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Intégrations
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="preferences">
                            <Palette className="mr-2 h-4 w-4" />
                            Préférences
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations du profil</CardTitle>
                                <CardDescription>
                                    Mettez à jour vos informations personnelles
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="text-lg">JD</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm">
                                            Changer la photo
                                        </Button>
                                        <p className="text-xs text-slate-500">
                                            JPG, PNG ou GIF. Max 2MB.
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Prénom</Label>
                                        <Input id="firstName" defaultValue="Jean" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Nom</Label>
                                        <Input id="lastName" defaultValue="Dupont" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="jean.dupont@email.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Input
                                        id="bio"
                                        placeholder="Une courte description..."
                                        defaultValue="Expert en SEO et content marketing"
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-medium">Changer le mot de passe</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                        <Input id="currentPassword" type="password" />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                            <Input id="newPassword" type="password" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                            <Input id="confirmPassword" type="password" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline">Annuler</Button>
                                    <Button onClick={handleSave}>Enregistrer les modifications</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Connexions externes</CardTitle>
                                <CardDescription>
                                    Connectez vos outils et services préférés
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                                            <Mail className="h-6 w-6 text-slate-700" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">Notion</h3>
                                                {notionConnected ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <Check className="h-3 w-3" />
                                                        Connecté
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <X className="h-3 w-3" />
                                                        Déconnecté
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Synchronisez vos articles avec votre workspace Notion
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={notionConnected ? "outline" : "default"}
                                        onClick={handleConnectNotion}
                                    >
                                        {notionConnected ? "Déconnecter" : "Connecter"}
                                    </Button>
                                </div>

                                {notionConnected && (
                                    <div className="rounded-lg bg-slate-50 p-4">
                                        <h4 className="mb-3 text-sm font-medium">Configuration Notion</h4>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="notionWorkspace">Workspace</Label>
                                                <Input
                                                    id="notionWorkspace"
                                                    defaultValue="Mon Workspace"
                                                    readOnly
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="notionDatabase">Base de données</Label>
                                                <Select defaultValue="articles">
                                                    <SelectTrigger id="notionDatabase">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="articles">Articles de blog</SelectItem>
                                                        <SelectItem value="ideas">Idées de contenu</SelectItem>
                                                        <SelectItem value="calendar">Calendrier éditorial</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Synchronisation automatique</Label>
                                                    <p className="text-xs text-slate-500">
                                                        Synchroniser automatiquement lors de la publication
                                                    </p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                                            <svg className="h-6 w-6" viewBox="0 0 24 24">
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">Google Account</h3>
                                                {googleConnected ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <Check className="h-3 w-3" />
                                                        Connecté
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <X className="h-3 w-3" />
                                                        Déconnecté
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Connexion rapide et accès aux services Google
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={googleConnected ? "outline" : "default"}
                                        onClick={handleConnectGoogle}
                                    >
                                        {googleConnected ? "Déconnecter" : "Connecter"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Préférences de notification</CardTitle>
                                <CardDescription>
                                    Choisissez comment vous souhaitez être informé
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Notifications par email</Label>
                                        <p className="text-sm text-slate-500">
                                            Recevez des notifications sur votre adresse email
                                        </p>
                                    </div>
                                    <Switch
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Rapport hebdomadaire</Label>
                                        <p className="text-sm text-slate-500">
                                            Recevez un résumé de votre activité chaque semaine
                                        </p>
                                    </div>
                                    <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Suggestions IA</Label>
                                        <p className="text-sm text-slate-500">
                                            Recevez des suggestions d'amélioration de contenu
                                        </p>
                                    </div>
                                    <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label>Types de notifications</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Nouveaux commentaires</span>
                                            <Switch defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Mises à jour de l'application</span>
                                            <Switch defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Conseils et astuces</span>
                                            <Switch />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave}>Enregistrer les préférences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Préférences de l'application</CardTitle>
                                <CardDescription>
                                    Personnalisez votre expérience utilisateur
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Langue de l'interface</Label>
                                    <Select defaultValue="fr">
                                        <SelectTrigger id="language">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Fuseau horaire</Label>
                                    <Select defaultValue="paris">
                                        <SelectTrigger id="timezone">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paris">Europe/Paris (GMT+1)</SelectItem>
                                            <SelectItem value="london">Europe/London (GMT+0)</SelectItem>
                                            <SelectItem value="newyork">America/New_York (GMT-5)</SelectItem>
                                            <SelectItem value="tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Paramètres IA par défaut
                                    </Label>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultTone" className="text-sm">
                                            Ton de voix par défaut
                                        </Label>
                                        <Select defaultValue="professional">
                                            <SelectTrigger id="defaultTone">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">Professionnel</SelectItem>
                                                <SelectItem value="casual">Décontracté</SelectItem>
                                                <SelectItem value="friendly">Amical</SelectItem>
                                                <SelectItem value="formal">Formel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultWords" className="text-sm">
                                            Nombre de mots par défaut
                                        </Label>
                                        <Input id="defaultWords" type="number" defaultValue="800" />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Mode sombre</Label>
                                        <p className="text-sm text-slate-500">
                                            Activer le thème sombre de l'interface
                                        </p>
                                    </div>
                                    <Switch />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave}>Enregistrer les préférences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default Settings;