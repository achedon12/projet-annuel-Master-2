# Auth — opt-in JWT, no Symfony firewall

There is **no** Symfony security firewall configured. Authentication is per-controller, opt-in.

`App\Controller\Api\AuthController` issues HS256 JWTs (signed with `JWT_SECRET`, 7-day expiry, payload `{ userId, email, name, iat, exp }`) on `POST /api/auth/login` and `POST /api/auth/signup`. Both return `{ token, user }`.

To protect a route, inject `App\Service\JwtAuthService` and call `authenticate($request)` — it extracts the `Authorization: Bearer …` header, decodes the JWT, and resolves the `User`. Returns `null` if invalid; the controller is responsible for returning 401. See `App\Controller\Api\UserIpController` for the canonical pattern.

If you add a new protected endpoint, follow that pattern — don't try to wire up the Symfony security component.

The default `JWT_SECRET` in `.env` is a placeholder; change it in any non-dev environment.
