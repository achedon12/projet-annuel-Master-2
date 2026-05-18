"use client";

const TONE_MAP = {
    emerald: {
        iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    blue: {
        iconBg: "bg-blue-100 dark:bg-blue-950/40",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    amber: {
        iconBg: "bg-amber-100 dark:bg-amber-950/40",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    violet: {
        iconBg: "bg-violet-100 dark:bg-violet-950/40",
        iconColor: "text-violet-600 dark:text-violet-400",
    },
    rose: {
        iconBg: "bg-rose-100 dark:bg-rose-950/40",
        iconColor: "text-rose-600 dark:text-rose-400",
    },
    slate: {
        iconBg: "bg-slate-100 dark:bg-slate-800",
        iconColor: "text-slate-600 dark:text-slate-300",
    },
};

/**
 * KPI card unifiée. Reprend le pattern admin : label uppercase à gauche,
 * badge icône coloré à droite, valeur en gras dessous, hint optionnel.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.value
 * @param {React.ComponentType} [props.icon]
 * @param {keyof typeof TONE_MAP} [props.tone="emerald"]
 * @param {string} [props.hint]
 */
export const StatCard = ({ label, value, icon: Icon, tone = "emerald", hint }) => {
    const palette = TONE_MAP[tone] || TONE_MAP.emerald;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {label}
                </span>
                {Icon && (
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${palette.iconBg}`}>
                        <Icon className={`h-4 w-4 ${palette.iconColor}`} />
                    </span>
                )}
            </div>
            <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {value}
            </p>
            {hint && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            )}
        </div>
    );
};

export default StatCard;
