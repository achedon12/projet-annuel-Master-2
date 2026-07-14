"use client";

import { Home, Lightbulb, PenTool, History, Settings, ShieldCheck, LogOut, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {cn} from "@/utils/Cn";
import {useTranslation} from "@/hooks/useI18n";

export const Sidebar = ({ onNavigate }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const handleNavClick = (href) => {
    onNavigate?.();
  };

  const navigation = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: Home },
    { name: t('nav.ideas'), href: "/ideas", icon: Lightbulb },
    { name: t('nav.editor'), href: "/editor", icon: PenTool },
    { name: t('nav.history'), href: "/history", icon: History },
    { name: t('nav.organization'), href: "/organization", icon: Building2 },
    { name: t('nav.settings'), href: "/settings", icon: Settings },
    ...(isAdmin ? [{ name: t('nav.admin'), href: "/admin", icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success(t("auth.toast.logoutSuccess"));
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white overflow-y-auto">
      <div className="hidden md:flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <PenTool className="h-4.5 w-4.5" />
        </span>
        <span className="text-base font-semibold tracking-tight">{t("brand")}</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-slate-800/80 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500"
                />
              )}
              <Icon className={cn("h-4.5 w-4.5", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5 group-hover:text-rose-400" />
          <span className="font-medium">{ t('nav.logout') }</span>
        </button>
      </div>
    </div>
  );
}
