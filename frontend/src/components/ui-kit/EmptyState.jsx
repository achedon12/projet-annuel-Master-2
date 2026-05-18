"use client";

/**
 * Empty state cohérent (illustration optionnelle, titre, description, CTA).
 * Remplace les `border border-dashed py-12` ad-hoc disséminés.
 */
export const EmptyState = ({ icon: Icon, title, description, action, footer, className = "" }) => (
    <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40 ${className}`}
    >
        {Icon && (
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
                <Icon className="h-5 w-5" />
            </span>
        )}
        {title && (
            <p className="text-base font-medium text-slate-900 dark:text-slate-100">{title}</p>
        )}
        {description && (
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {description}
            </p>
        )}
        {action && <div className="mt-5">{action}</div>}
        {footer && <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{footer}</div>}
    </div>
);

export default EmptyState;
