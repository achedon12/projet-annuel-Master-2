# IP banning and login history

## Global ban gate

`App\EventListener\IpBanCheckListener` runs at `kernel.request` priority 100 and short-circuits any `/api/*` request from a banned IP with 403. `BannedIp` rows are managed manually — no admin UI in this app.

## Getting the client IP

`App\Service\IpBanService::getClientIp($request)` is the canonical way to obtain the client IP. It honors `X-Forwarded-For` → `X-Real-IP` → `$request->getClientIp()`. Use it anywhere you record or look up IPs — never call `$request->getClientIp()` directly.

## Login IP history

`App\Entity\UserLoginIp` — one row per `(user, IP)` pair; `lastSeenAt` is bumped on each subsequent login from the same IP (index on `(user_id, ip_address)`).

`AuthController` calls `App\Service\UserLoginIpRecorder::record($user, $request, 'login'|'signup')` after a successful auth. The recorder uses `IpBanService::getClientIp()` for consistency.

Exposed to the frontend via `GET /api/user/ips` (returns the history with an `isCurrent` flag for the IP matching the current request).
