"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

/**
 * Reçoit le redirect Google après autorisation Calendar.
 * Échange le code reçu via le backend (qui appellera Google avec le client_secret),
 * puis redirige vers Settings avec un toast de confirmation.
 */
const GoogleCalendarCallback = () => {
    const router = useRouter();
    const params = useSearchParams();
    const { data: session, status: sessionStatus } = useSession();
    const { t } = useTranslation();
    const handledRef = useRef(false);

    const token = session?.backendToken;

    useEffect(() => {
        if (sessionStatus === "loading") return;
        if (sessionStatus !== "authenticated" || !token) {
            // L'user n'est pas connecté — on le renvoie vers /auth en gardant le callback URL.
            router.replace("/auth?callbackUrl=" + encodeURIComponent("/settings"));
            return;
        }
        if (handledRef.current) return;
        handledRef.current = true;

        const code = params.get("code");
        const errorParam = params.get("error");
        if (errorParam) {
            toast.error(t("settings.integrations.google.toast.consentDenied"));
            router.replace("/settings");
            return;
        }
        if (!code) {
            toast.error(t("settings.integrations.google.toast.noCode"));
            router.replace("/settings");
            return;
        }

        const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;

        fetch(`${API_URL}${Urls.integrations.googleCalendarConnect}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ code, redirectUri }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    let msg = t("settings.integrations.google.toast.connectError");
                    try {
                        const data = await res.json();
                        if (data?.error) msg = data.error;
                    } catch {
                        /* fallback */
                    }
                    toast.error(msg);
                    router.replace("/settings");
                    return;
                }
                toast.success(t("settings.integrations.google.toast.connectSuccess"));
                router.replace("/settings");
            })
            .catch(() => {
                toast.error(t("settings.integrations.google.toast.connectError"));
                router.replace("/settings");
            });
    }, [sessionStatus, token, params, router, t]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>{t("settings.integrations.google.callbackProcessing")}</p>
            </div>
        </div>
    );
};

export default GoogleCalendarCallback;
