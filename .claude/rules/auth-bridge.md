# Auth bridge between the two apps

The frontend has no auth database of its own. NextAuth's `CredentialsProvider` (`frontend/src/lib/auth.js`) calls the Symfony `POST /api/auth/login` endpoint, parses the `{ token, user }` payload, and stuffs the Symfony JWT into the NextAuth JWT under `session.backendToken`.

When the frontend needs to hit a protected Symfony route, it reads `session.backendToken` via `useSession()` and sends it as `Authorization: Bearer …`. Canonical example: `frontend/src/components/settings/SecurityIpList.jsx`.

Three things must stay in lockstep across the two repos:

- `JWT_SECRET` (in `backend/.env`) — signs the tokens NextAuth re-uses opaquely.
- The login response shape `{ token, user }` — parsed by `frontend/src/lib/auth.js`.
- The route paths `/api/auth/login` and `/api/auth/signup` — referenced in `frontend/src/utils/Api.js`.

If you change any of these on one side, update the other.
