# Theming — next-themes + CSS variables

`next-themes` is wired in `src/components/Providers.jsx` with `attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`. CSS variables for light/dark are defined in `src/app/styles/theme.css` (`@custom-variant dark`, `:root` and `.dark` blocks).

- UI primitives in `src/components/` (Card, Button, Badge, Input, …) use semantic tokens (`bg-card`, `text-muted-foreground`, `border` via `--border`) and adapt automatically.
- Page-level surfaces use explicit pairs: `bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`, `text-slate-600 dark:text-slate-400`, etc. Keep this convention when adding new pages — don't ship light-only.
- The Sidebar (`src/components/Sidebar.jsx`) and mobile topbar (in `LayoutWrapper.jsx`) use a permanent `bg-slate-900` — **by design** (dark sidebar over both light and dark pages). Do not add `dark:` variants there.
- The toggle goes through `useTheme()` in `src/app/settings/page.jsx` (Préférences tab, Mode sombre switch) — `setTheme('dark'|'light')`.
- `<html suppressHydrationWarning>` is required for next-themes to avoid SSR mismatch — already set in `src/app/layout.jsx`.
