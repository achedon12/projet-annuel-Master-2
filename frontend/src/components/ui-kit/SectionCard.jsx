"use client";

/**
 * Section card générique avec header (titre + description + actions) et body.
 * Equivalent du Panel admin, adapté aux pages user (padding plus généreux).
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.padding="md"] - "none" | "sm" | "md" | "lg"
 */
export const SectionCard = ({
    title,
    description,
    actions,
    padding = "md",
    className = "",
    children,
}) => {
    const padMap = {
        none: "",
        sm: "p-4",
        md: "p-5 md:p-6",
        lg: "p-6 md:p-8",
    };
    const bodyPad = padMap[padding] ?? padMap.md;

    return (
        <section
            className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            {(title || description || actions) && (
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between md:px-6">
                    <div className="min-w-0">
                        {title && (
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
                    )}
                </div>
            )}
            <div className={bodyPad}>{children}</div>
        </section>
    );
};

export default SectionCard;
