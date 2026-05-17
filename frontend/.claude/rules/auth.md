# Auth — NextAuth bridges to the Symfony backend

NextAuth doesn't run its own DB. The `CredentialsProvider` in `src/lib/auth.js` calls `${NEXT_PUBLIC_API_URL}/api/auth/login`, parses the `{ token, user }` response, and stores the Symfony JWT inside the NextAuth JWT under `session.backendToken`. Consequences:

- `useSession()` is the source of truth for *both* the logged-in user and the Symfony API token.
- Any client component that needs to hit a protected Symfony route must read `session.backendToken` and send `Authorization: Bearer ${session.backendToken}`. Canonical example: `src/components/settings/SecurityIpList.jsx`.
- Errors thrown inside `authorize()` propagate as `res.error` in `signIn('credentials', { redirect: false })`. The mapping to translation keys is `auth.toast.loginInvalid` / `auth.toast.loginNetwork`.
- Route protection is centralized in `src/proxy.js` (matcher: `/dashboard`, `/history`, `/ideas`, `/settings`, `/editor`). `ClientLayout.jsx` no longer enforces auth — it just consumes `useSession()` for loading states.
- Logout pattern: `signOut({ redirect: false })` then manual `router.push('/auth')`. Used in `Sidebar.jsx`.

`app/api/auth/[...nextauth]/route.js` — NextAuth route handler; do not add other auth handlers next to it.
