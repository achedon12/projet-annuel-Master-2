"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, PenTool, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const AcceptInvitePage = () => {
    const router = useRouter();
    const params = useSearchParams();
    const { t } = useTranslation();
    const token = params.get("token");

    const [state, setState] = useState("loading"); // loading | form | error
    const [invitation, setInvitation] = useState(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        const run = async () => {
            if (!token) {
                setState("error");
                return;
            }
            try {
                const res = await fetch(`${API_URL}${Urls.auth.invitationLookup(token)}`);
                const data = await res.json().catch(() => null);
                if (!active) return;
                if (!res.ok || !data?.email) {
                    setState("error");
                    return;
                }
                setInvitation(data);
                setState(data.userExists ? "error" : "form");
            } catch (err) {
                if (active) setState("error");
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            toast.error(t("acceptInvite.passwordTooShort"));
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.auth.acceptInvitation}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, name: name.trim() || undefined }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                toast.error(data?.error ?? t("acceptInvite.error"));
                setSubmitting(false);
                return;
            }
            // Compte créé : on ouvre la session avec l'email de l'invitation et
            // le mot de passe qui vient d'être choisi.
            const signInRes = await signIn("credentials", {
                email: invitation.email,
                password,
                redirect: false,
            });
            if (signInRes?.error) {
                // Compte créé mais connexion auto échouée : on renvoie au login.
                toast.success(t("acceptInvite.created"));
                router.push("/auth");
                return;
            }
            toast.success(t("acceptInvite.created"));
            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            console.error("acceptInvite.submit", err);
            toast.error(t("acceptInvite.error"));
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                        {state === "error" ? t("acceptInvite.errorTitle") : t("acceptInvite.title")}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        {state === "loading" && t("acceptInvite.loading")}
                        {state === "error" && t("acceptInvite.errorDescription")}
                        {state === "form" && invitation && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                {t("acceptInvite.subtitle", { org: invitation.organizationName })}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {state === "loading" && (
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}

                    {state === "error" && (
                        <Button
                            className="w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => router.push("/auth")}
                        >
                            {t("acceptInvite.backToLogin")}
                        </Button>
                    )}

                    {state === "form" && invitation && (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label>{t("acceptInvite.emailLabel")}</Label>
                                <Input value={invitation.email} disabled readOnly />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t("acceptInvite.nameLabel")}</Label>
                                <Input
                                    placeholder={t("acceptInvite.namePlaceholder")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t("acceptInvite.passwordLabel")}</Label>
                                <Input
                                    type="password"
                                    placeholder={t("acceptInvite.passwordPlaceholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("acceptInvite.submit")}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AcceptInvitePage;
