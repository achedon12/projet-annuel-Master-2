"use client";
import { useState } from "react";
import { PenTool, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { CardHeader, Card, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { Label } from "@/components/Label";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { API_URL, Urls } from "@/utils/Api";
import { LOGIN_INVALID, LOGIN_NETWORK } from "@/lib/auth";
import { useTranslation } from "@/hooks/useI18n";

const AuthPage = () => {
    const router = useRouter();
    const params = useSearchParams();
    const callbackUrl = params.get("callbackUrl") || "/dashboard";
    const { t } = useTranslation();

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

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });

        setLoading(false);

        if (res?.error) {
            let message;
            if (res.error === LOGIN_NETWORK) {
                message = t("auth.toast.loginNetwork");
            } else if (res.error === LOGIN_INVALID) {
                message = t("auth.toast.loginInvalid");
            } else {
                message = t("auth.toast.loginError");
            }
            setError(message);
            toast.error(message);
            return;
        }

        toast.success(t("auth.toast.loginSuccess"));
        router.push(res?.url || callbackUrl);
        router.refresh();
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

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = data.error || data.message || t("auth.toast.signupError");
                setError(message);
                toast.error(message);
                setLoading(false);
                return;
            }

            toast.success(t("auth.toast.signupSuccess"));

            const signInRes = await signIn("credentials", {
                email: signupEmail,
                password: signupPassword,
                redirect: false,
                callbackUrl,
            });

            setLoading(false);

            if (signInRes?.error) {
                const message = t("auth.toast.signupCreatedButLoginFailed");
                setError(message);
                toast.warning(message);
                return;
            }

            toast.success(t("auth.toast.signupWelcome"));
            router.push(signInRes?.url || callbackUrl);
            router.refresh();
        } catch (err) {
            setLoading(false);
            const message = t("auth.toast.loginNetwork");
            setError(message);
            toast.error(message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                        <PenTool className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{t("brand")}</CardTitle>
                    <CardDescription>{t("auth.tagline")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">{t("auth.tabs.login")}</TabsTrigger>
                            <TabsTrigger value="signup">{t("auth.tabs.signup")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4">
                            {error && <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("form.email")}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t("auth.login.emailPlaceholder")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t("form.password")}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder={t("auth.login.passwordPlaceholder")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
                                    {t("auth.login.submit")}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="space-y-4">
                            {error && <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">{t("auth.signup.fullName")}</Label>
                                    <Input
                                        id="signup-name"
                                        type="text"
                                        placeholder={t("auth.signup.fullNamePlaceholder")}
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">{t("form.email")}</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder={t("auth.login.emailPlaceholder")}
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">{t("form.password")}</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        placeholder={t("auth.login.passwordPlaceholder")}
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ""}
                                    {t("auth.signup.submit")}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthPage;
