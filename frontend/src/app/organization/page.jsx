"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Building2,
    UserPlus,
    Trash2,
    Loader2,
    Crown,
    Mail,
    Send,
    ShieldCheck,
    KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Badge } from "@/components/Badge";
import { Switch } from "@/components/Switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/Dialog";
import { PageShell, PageHeader, SectionCard, EmptyState } from "@/components/ui-kit";
import { useTranslation } from "@/hooks/useI18n";
import { API_URL, Urls } from "@/utils/Api";

const PERMISSION_KEYS = [
    "canGenerateArticles",
    "canEditArticles",
    "canDeleteArticles",
    "canExport",
    "canManageNotion",
    "canSchedule",
    "canInviteUsers",
];

const DEFAULT_PERMS = {
    canGenerateArticles: true,
    canEditArticles: true,
    canDeleteArticles: false,
    canExport: true,
    canManageNotion: false,
    canSchedule: false,
    canInviteUsers: false,
};

// Matrice de permissions : un interrupteur par capacité, libellé + description
// tirés de l'i18n (organization.permissions.<key>.{label,hint}).
const PermissionToggles = ({ value, onChange, keys, disabled }) => {
    const { t } = useTranslation();
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((key) => (
                <label
                    key={key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3"
                >
                    <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                            {t(`organization.permissions.${key}.label`)}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {t(`organization.permissions.${key}.hint`)}
                        </span>
                    </span>
                    <Switch
                        checked={!!value[key]}
                        disabled={disabled}
                        onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
                    />
                </label>
            ))}
        </div>
    );
};

const OrganizationPage = () => {
    const { t } = useTranslation();
    const { data: session, status: sessionStatus } = useSession();
    const token = session?.backendToken;

    const [org, setOrg] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [nameInput, setNameInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Ajout de membre : deux modes — invitation par email ou création directe.
    const [addMode, setAddMode] = useState("invite");
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePerms, setInvitePerms] = useState(DEFAULT_PERMS);
    const [subEmail, setSubEmail] = useState("");
    const [subName, setSubName] = useState("");
    const [subPassword, setSubPassword] = useState("");
    const [subPerms, setSubPerms] = useState(DEFAULT_PERMS);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [removingId, setRemovingId] = useState(null);
    const [revokingId, setRevokingId] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [editPerms, setEditPerms] = useState(DEFAULT_PERMS);
    const [isSavingPerms, setIsSavingPerms] = useState(false);

    const tRef = useRef(t);
    tRef.current = t;

    const permissionKeys = org?.permissionKeys ?? PERMISSION_KEYS;

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

    const handleInvite = async () => {
        if (!token || !inviteEmail.trim()) {
            toast.error(t("organization.emailRequired"));
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.invitations}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: inviteEmail.trim(), permissions: invitePerms }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.inviteError"));
                return;
            }
            setOrg(data.organization);
            setInviteEmail("");
            setInvitePerms(DEFAULT_PERMS);
            toast.success(t("organization.invited"));
        } catch (err) {
            console.error("organization.invite", err);
            toast.error(t("organization.inviteError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSub = async () => {
        if (!token || !subEmail.trim()) {
            toast.error(t("organization.emailRequired"));
            return;
        }
        if (subPassword.length < 8) {
            toast.error(t("organization.passwordTooShort"));
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.members}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    email: subEmail.trim(),
                    name: subName.trim() || undefined,
                    password: subPassword,
                    permissions: subPerms,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.addError"));
                return;
            }
            setOrg(data.organization);
            setSubEmail("");
            setSubName("");
            setSubPassword("");
            setSubPerms(DEFAULT_PERMS);
            toast.success(t("organization.added"));
        } catch (err) {
            console.error("organization.createSub", err);
            toast.error(t("organization.addError"));
        } finally {
            setIsSubmitting(false);
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

    const handleRevoke = async (invitationId) => {
        if (!token) return;
        setRevokingId(invitationId);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.invitation(invitationId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.revokeError"));
                return;
            }
            setOrg(data.organization);
            toast.success(t("organization.revoked"));
        } catch (err) {
            console.error("organization.revoke", err);
            toast.error(t("organization.revokeError"));
        } finally {
            setRevokingId(null);
        }
    };

    const openEdit = (member) => {
        setEditingMember(member);
        setEditPerms({ ...DEFAULT_PERMS, ...member.permissions });
    };

    const handleSavePerms = async () => {
        if (!token || !editingMember) return;
        setIsSavingPerms(true);
        try {
            const res = await fetch(`${API_URL}${Urls.organization.member(editingMember.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ permissions: editPerms }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? t("organization.permsError"));
                return;
            }
            setOrg(data.organization);
            setEditingMember(null);
            toast.success(t("organization.permsSaved"));
        } catch (err) {
            console.error("organization.savePerms", err);
            toast.error(t("organization.permsError"));
        } finally {
            setIsSavingPerms(false);
        }
    };

    const grantedCount = (perms) => permissionKeys.filter((k) => perms?.[k]).length;

    return (
        <PageShell>
            <PageHeader
                eyebrow={t("organization.eyebrow")}
                title={t("organization.title")}
                description={t("organization.subtitle")}
                icon={<Building2 className="h-5 w-5" />}
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
                <div className="flex flex-col gap-6">
                    {/* Ajout de membre (owner uniquement) */}
                    {org.isOwner && (
                        <SectionCard title={t("organization.addTitle")} description={t("organization.addSubtitle")}>
                            <div className="mb-4 inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                                <button
                                    type="button"
                                    onClick={() => setAddMode("invite")}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                        addMode === "invite"
                                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    <Mail className="h-4 w-4" />
                                    {t("organization.modeInvite")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddMode("create")}
                                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                        addMode === "create"
                                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    <KeyRound className="h-4 w-4" />
                                    {t("organization.modeCreate")}
                                </button>
                            </div>

                            {addMode === "invite" ? (
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t("organization.emailLabel")}</Label>
                                        <Input
                                            type="email"
                                            placeholder={t("organization.addPlaceholder")}
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <PermissionToggles value={invitePerms} onChange={setInvitePerms} keys={permissionKeys} />
                                    <div>
                                        <Button onClick={handleInvite} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            {t("organization.inviteButton")}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label>{t("organization.emailLabel")}</Label>
                                            <Input
                                                type="email"
                                                placeholder={t("organization.addPlaceholder")}
                                                value={subEmail}
                                                onChange={(e) => setSubEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t("organization.nameLabel")}</Label>
                                            <Input
                                                placeholder={t("organization.namePlaceholderMember")}
                                                value={subName}
                                                onChange={(e) => setSubName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t("organization.passwordLabel")}</Label>
                                            <Input
                                                type="password"
                                                placeholder={t("organization.passwordPlaceholder")}
                                                value={subPassword}
                                                onChange={(e) => setSubPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <PermissionToggles value={subPerms} onChange={setSubPerms} keys={permissionKeys} />
                                    <div>
                                        <Button onClick={handleCreateSub} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                            {t("organization.createSubButton")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* Liste des membres */}
                    <SectionCard
                        title={org.name}
                        description={t("organization.memberCount", { count: org.memberCount })}
                    >
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                            {org.members.map((member) => (
                                <li key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.role === "owner" ? (
                                            <Badge variant="secondary">
                                                <Crown className="mr-1 h-3 w-3" />
                                                {t("organization.roleOwner")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                {t("organization.grantedCount", { count: grantedCount(member.permissions), total: permissionKeys.length })}
                                            </Badge>
                                        )}
                                        {org.isOwner && member.role !== "owner" && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEdit(member)}
                                                >
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    {t("organization.editPerms")}
                                                </Button>
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
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    {/* Invitations en attente (owner uniquement) */}
                    {org.isOwner && org.invitations?.length > 0 && (
                        <SectionCard title={t("organization.pendingTitle")} description={t("organization.pendingSubtitle")}>
                            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                                {org.invitations.map((inv) => (
                                    <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0 flex items-center gap-2">
                                            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate text-sm text-slate-700 dark:text-slate-300">{inv.email}</span>
                                            <Badge variant="outline" className="shrink-0">
                                                {t("organization.grantedCount", { count: grantedCount(inv.permissions), total: permissionKeys.length })}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRevoke(inv.id)}
                                            disabled={revokingId === inv.id}
                                            aria-label={t("organization.revokeButton")}
                                        >
                                            {revokingId === inv.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            )}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </SectionCard>
                    )}
                </div>
            )}

            {/* Édition des permissions d'un membre */}
            <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("organization.editPermsTitle")}</DialogTitle>
                        <DialogDescription>
                            {editingMember?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <PermissionToggles value={editPerms} onChange={setEditPerms} keys={permissionKeys} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingMember(null)}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSavePerms} disabled={isSavingPerms}>
                            {isSavingPerms && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("organization.savePerms")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell>
    );
};

export default OrganizationPage;
