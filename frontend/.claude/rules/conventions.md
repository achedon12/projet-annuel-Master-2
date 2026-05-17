# Page structure & conventions

## Pages

- Public: `/` (landing), `/auth` (login + signup tabs).
- Protected (gated by `src/proxy.js`): `/dashboard`, `/history`, `/ideas`, `/editor`, `/settings`.

## Toasts

`sonner` is mounted globally in `src/components/Providers.jsx` (`<Toaster position="top-right" richColors closeButton />`). Always `import { toast } from "sonner"` directly from the package.

The local wrapper at `src/components/Sonner.jsx` exists to centralize the `<Toaster />` styling — earlier versions of this file had a broken import from `@/components/sonner` (no such file). Don't reintroduce that path.

## Adding a new protected feature

1. Add the page under `src/app/<route>/page.jsx`.
2. Add `/<route>/:path*` to the `matcher` array in `src/proxy.js`.
3. If it calls the Symfony API, use the `useSession()` + `session.backendToken` pattern (see `auth.md`).
4. Add strings to **both** `src/locales/fr.json` and `src/locales/en.json` (see `i18n.md`).
5. Use semantic tokens or `light dark:` pairs from the start (see `theming.md`) — don't ship light-only.
