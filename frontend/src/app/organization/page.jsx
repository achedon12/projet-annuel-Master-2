"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, UserPlus, Trash2, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { PageShell, PageHeader, SectionCard, EmptyState } from "@/components/ui-kit";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const OrganizationPage = () => {
    const { t } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const token = session?.backendToken;

    const [org, setOrg] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [nameInput, setNameInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const tRef = useRef(t);
    tRef.current = t;

    const fetchOrg = useCallback(async () => {
        if (!token) return;
        setLoadState("loading");
        try {
            const res = await fetch(`${API_URL}${Urls.organization.get}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setLoadState("error");
                toast.error(tRef.current("organization.loadError"));
                return;
            }
            const data = await res.json();
            setOrg(data?.organization ?? null);
            setLoadState("ready");
        } catch (err) {
            console.error("organization.fetch", err);
            setLoadState("error");
            toast.error(tRef.current("organization.loadError"));
        }
    }, [token]);

    useEffect(() => {
        if (sessionStatus === "authenticated") fetchOrg();
    }, [sessionStatus, fetchOrg]);

    const handleCreate = async () => {
        if (!token || nameInput.trim().length < 2) {
            toast.error(t("organization.nameRequired"));
            return;
        }
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.create}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: nameInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.createError"));
                return;
            }
            setOrg(data.organization);
            setNameInput("");
            toast.success(t("organization.created"));
        } catch (err) {
            console.error("organization.create", err);
            toast.error(t("organization.createError"));
        } finally {
            setIsCreating(false);
        }
    };

    const handleAdd = async () => {
        if (!token || !emailInput.trim()) {
            toast.error(t("organization.emailRequired"));
            return;
        }
        setIsAdding(true);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.members}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: emailInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.addError"));
                return;
            }
            setOrg(data.organization);
            setEmailInput("");
            toast.success(t("organization.added"));
        } catch (err) {
            console.error("organization.add", err);
            toast.error(t("organization.addError"));
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (userId) => {
        if (!token) return;
        setRemovingId(userId);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.member(userId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.removeError"));
                return;
            }
            setOrg(data.organization);
            toast.success(t("organization.removed"));
        } catch (err) {
            console.error("organization.remove", err);
            toast.error(t("organization.removeError"));
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <PageShell>
            <PageHeader
                eyebrow={t("organization.eyebrow")}
                title={t("organization.title")}
                description={t("organization.subtitle")}
                icon={Building2}
            />

            {loadState === "loading" ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
                </div>
            ) : !org ? (
                <SectionCard title={t("organization.createTitle")} description={t("organization.createSubtitle")}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                            placeholder={t("organization.namePlaceholder")}
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            maxLength={120}
                        />
                        <Button onClick={handleCreate} disabled={isCreating} className="shrink-0">
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                            {t("organization.createButton")}
                        </Button>
                    </div>
                </SectionCard>
            ) : (
                <SectionCard
                    title={org.name}
                    description={t("organization.memberCount", { count: org.memberCount })}
                    actions={
                        org.isOwner ? (
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                                <Input
                                    type="email"
                                    placeholder={t("organization.addPlaceholder")}
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full sm:w-64"
                                />
                                <Button onClick={handleAdd} disabled={isAdding} className="shrink-0">
                                    {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    {t("organization.addButton")}
                                </Button>
                            </div>
                        ) : null
                    }
                >
                    {org.members.length === 0 ? (
                        <EmptyState icon={Building2} title={t("organization.emptyMembers")} />
                    ) : (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                            {org.members.map((member) => (
                                <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                            {member.name}
                                        </p>
                                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                            {member.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.role === "owner" ? (
                                            <Badge variant="secondary">
                                                <Crown className="mr-1 h-3 w-3" />
                                                {t("organization.roleOwner")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">{t("organization.roleMember")}</Badge>
                                        )}
                                        {org.isOwner && member.role !== "owner" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(member.id)}
                                                disabled={removingId === member.id}
                                                aria-label={t("organization.removeButton")}
                                            >
                                                {removingId === member.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            )}
        </PageShell>
    );
};

export default OrganizationPage;
