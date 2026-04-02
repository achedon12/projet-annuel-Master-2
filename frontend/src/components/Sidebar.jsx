"use client";

import { Home, Lightbulb, PenTool, History, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {cn} from "../utils/Cn";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Générateur d'idées", href: "/ideas", icon: Lightbulb },
  { name: "Éditeur de contenu", href: "/editor", icon: PenTool },
  { name: "Historique", href: "/history", icon: History },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export const Sidebar = ({ onNavigate }) => {
  const pathname = usePathname();

  const handleNavClick = (href) => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white overflow-y-auto">
      <div className="hidden md:flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <PenTool className="h-6 w-6 text-emerald-400" />
        <span className="text-lg">SEO Content AI</span>
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
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
