"use client";

const VARIANTS = {
    // Statuts d'articles
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    review: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    archived: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",

    // Sémantique générique
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",

    // Difficulté (ideas)
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",

    // Accent brand
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

/**
 * Badge / pill de statut unifié. Préférer cette primitive aux classes inline
 * pour garder cohérence light/dark.
 *
 * @param {object} props
 * @param {keyof typeof VARIANTS} props.variant
 * @param {React.ReactNode} [props.icon]
 */
export const StatusBadge = ({ variant = "neutral", icon: Icon, children, className = "" }) => {
    const cls = VARIANTS[variant] || VARIANTS.neutral;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls} ${className}`}
        >
            {Icon && <Icon className="h-3 w-3" />}
            {children}
        </span>
    );
};

export default StatusBadge;
