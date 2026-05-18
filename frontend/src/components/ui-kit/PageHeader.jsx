"use client";

/**
 * Header de page : eyebrow optionnel + titre + description + actions.
 * Pattern repris de AdminPageHeader mais sans breadcrumb (les pages user
 * sont au premier niveau).
 *
 * @param {object} props
 * @param {string} [props.eyebrow] - Petit label uppercase au-dessus du titre.
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions] - Boutons à droite (CTAs primaires/secondaires).
 * @param {React.ReactNode} [props.icon] - Icône décorative à gauche du titre (optionnel).
 */
export const PageHeader = ({ eyebrow, title, description, actions, icon }) => (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex items-start gap-3">
            {icon && (
                <span className="hidden md:grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {icon}
                </span>
            )}
            <div className="min-w-0">
                {eyebrow && (
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
);

export default PageHeader;
