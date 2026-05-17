"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Shield, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { API_URL, Urls } from "@/utils/Api";
import { useTranslation } from "@/hooks/useI18n";

const formatDate = (iso, locale) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
};

export const SecurityIpList = () => {
    const { t, locale } = useTranslation();
    const { data: session, status } = useSession();
    const [items, setItems] = useState([]);
    const [currentIp, setCurrentIp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIps = useCallback(async () => {
        if (!session?.backendToken) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}${Urls.user.ips}`, {
                headers: {
                    Authorization: `Bearer ${session.backendToken}`,
                },
            });
            if (!res.ok) throw new Error("request failed");
            const data = await res.json();
            setItems(data.items || []);
            setCurrentIp(data.currentIp || null);
        } catch (e) {
            setError(t("settings.security.loadError"));
        } finally {
            setLoading(false);
        }
    }, [session?.backendToken, t]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchIps();
        }
    }, [status, fetchIps]);

    const eventLabel = (event) => {
        if (!event) return "—";
        const key = `settings.security.events.${event}`;
        const translated = t(key);
        return translated === key ? event : translated;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {t("settings.security.title")}
                        </CardTitle>
                        <CardDescription>{t("settings.security.description")}</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchIps}
                        disabled={loading || status !== "authenticated"}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        {t("settings.security.refresh")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentIp && (
                    <div className="flex items-center gap-2 rounded-md border dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm">
                        <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-slate-600 dark:text-slate-400">{t("settings.security.currentIp")} :</span>
                        <span className="font-mono font-medium">{currentIp}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("settings.security.loading")}
                    </div>
                ) : error ? (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
                ) : items.length === 0 ? (
                    <div className="rounded-md border border-dashed dark:border-slate-700 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("settings.security.empty")}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border dark:border-slate-800">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-2">{t("settings.security.table.ip")}</th>
                                    <th className="px-4 py-2">{t("settings.security.table.event")}</th>
                                    <th className="px-4 py-2">{t("settings.security.table.firstSeen")}</th>
                                    <th className="px-4 py-2">{t("settings.security.table.lastSeen")}</th>
                                    <th className="px-4 py-2">{t("settings.security.table.userAgent")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {items.map((item) => (
                                    <tr key={item.id} className={item.isCurrent ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}>
                                        <td className="px-4 py-3 font-mono">
                                            <div className="flex items-center gap-2">
                                                {item.ipAddress}
                                                {item.isCurrent && (
                                                    <Badge variant="default" className="text-xs">
                                                        {t("settings.security.currentBadge")}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{eventLabel(item.event)}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {formatDate(item.createdAt, locale)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {formatDate(item.lastSeenAt, locale)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={item.userAgent || ""}>
                                            {item.userAgent || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
