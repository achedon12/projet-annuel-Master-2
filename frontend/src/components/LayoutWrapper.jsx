"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const SIDEBAR_ROUTES = ["/dashboard", "/history", "/ideas", "/settings", "/editor"];

export function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const showSidebar = SIDEBAR_ROUTES.includes(pathname);

  return (
    <div className="flex flex-row max-h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

