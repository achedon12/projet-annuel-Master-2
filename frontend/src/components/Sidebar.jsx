"use client";

import { Home, Lightbulb, PenTool, History, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {cn} from "@/utils/Cn";
import {useTranslation} from "@/hooks/useI18n";

export const Sidebar = ({ onNavigate }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const handleNavClick = (href) => {
    onNavigate?.();
  };

  const navigation = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: Home },
    { name: t('nav.ideas'), href: "/ideas", icon: Lightbulb },
    { name: t('nav.editor'), href: "/editor", icon: PenTool },
    { name: t('nav.history'), href: "/history", icon: History },
    { name: t('nav.settings'), href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success(t("auth.toast.logoutSuccess"));
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white overflow-y-auto">
      <div className="hidden md:flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <PenTool className="h-6 w-6 text-emerald-400" />
        <span className="text-lg">{t("brand")}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>{ t('nav.logout') }</span>
        </button>
      </div>
    </div>
  );
}
