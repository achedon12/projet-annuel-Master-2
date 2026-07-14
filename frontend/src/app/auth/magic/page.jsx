"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, PenTool } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTranslation } from "@/hooks/useI18n";

const MagicConsumePage = () => {
    const router = useRouter();
    const params = useSearchParams();
    const { t } = useTranslation();
    const [state, setState] = useState("working"); // working | error
    const token = params.get("token");

    useEffect(() => {
        let active = true;
        const run = async () => {
            if (!token) {
                setState("error");
                return;
            }
            const res = await signIn("credentials", { magicToken: token, redirect: false });
            if (!active) return;
            if (res?.error) {
                setState("error");
                return;
            }
            router.push("/dashboard");
            router.refresh();
        };
        run();
        return () => {
            active = false;
        };
    }, [token, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                        {state === "error" ? t("auth.magic.errorTitle") : t("auth.magic.verifying")}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        {state === "error" ? t("auth.magic.errorDescription") : t("auth.magic.verifyingDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {state === "working" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <Button
                            className="w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => router.push("/auth")}
                        >
                            {t("auth.magic.backToLogin")}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MagicConsumePage;
