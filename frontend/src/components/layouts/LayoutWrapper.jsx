"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { useTranslation } from "@/hooks/useI18n";

const SIDEBAR_ROUTES = ["/dashboard", "/history", "/ideas", "/settings", "/editor"];

export const LayoutWrapper = ({ children }) => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const showSidebar = SIDEBAR_ROUTES.includes(pathname);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex flex-col md:flex-row max-h-screen">
            {showSidebar && (
                <div className="md:hidden flex items-center gap-4 bg-slate-900 text-white p-4 border-b border-slate-700">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                    <span className="text-lg font-semibold">{t("brand")}</span>
                </div>
            )}

            {showSidebar && (
                <>
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
                            onClick={closeSidebar}
                        />
                    )}
                    <div
                        className={`fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-screen w-64 md:w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out md:translate-x-0 z-40 ${
                            sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                    >
                        <Sidebar onNavigate={closeSidebar} />
                    </div>
                </>
            )}

            <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:max-h-screen">
                {children}
            </main>
        </div>
    );
};
