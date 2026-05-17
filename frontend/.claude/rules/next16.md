# Next.js 16 — non-obvious changes

Per `AGENTS.md`: this version has breaking changes vs older Next docs that you may have memorized. The big one in this repo:

- **`middleware.ts` → `proxy.ts`.** Same API, renamed. Lives at `src/proxy.js`. The matcher syntax and `withAuth` integration are unchanged.

When in doubt, **read the doc** at `node_modules/next/dist/docs/` before writing config or routing code. Heed deprecation notices.
