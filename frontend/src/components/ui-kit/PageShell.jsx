"use client";

/**
 * Wrapper de page user (dashboard, history, ideas, settings, editor).
 * Garantit fond + padding + container cohérents sur toutes les pages.
 * Permet aux pages de ne s'occuper que de leur contenu structuré.
 */
export const PageShell = ({ children, className = "" }) => (
    <div className={`flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 ${className}`}>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
            <div className="space-y-6 md:space-y-8">{children}</div>
        </div>
    </div>
);

export default PageShell;
