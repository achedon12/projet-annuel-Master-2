"use client";
import { useState } from "react";
import { PenTool, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {CardHeader, Card, CardTitle, CardDescription, CardContent} from "@/components/Card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/Tabs";
import {Label} from "@/components/Label";
import {Button} from "@/components/Button";
import {Input} from "@/components/Input";
import {API_URL} from "@/utils/Api";
import {Urls} from "../../utils/Api";

const AuthPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}${Urls.auth.login}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Erreur de connexion");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/dashboard");
        } catch (err) {
            setError("Erreur réseau. Vérifiez que le serveur est actif.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}${Urls.auth.signup}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: signupName,
                    email: signupEmail,
                    password: signupPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Erreur d'inscription");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            router.push("/dashboard");
        } catch (err) {
            setError("Erreur réseau. Vérifiez que le serveur est actif.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                        <PenTool className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">SEO Content AI</CardTitle>
                    <CardDescription>
                        Créez du contenu optimisé SEO avec l'intelligence artificielle
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Connexion</TabsTrigger>
                            <TabsTrigger value="signup">Inscription</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4">
                            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
                                    Se connecter
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="space-y-4">
                            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Nom complet</Label>
                                    <Input
                                        id="signup-name"
                                        type="text"
                                        placeholder="Jean Dupont"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Mot de passe</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
                                    Créer un compte
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default AuthPage;