# Top-level commands

Infra runs via docker-compose at the repo root; the two apps run on the host.

```bash
docker compose up -d                      # MySQL, phpMyAdmin (:8080), MailHog (:8025 SMTP :1025)
cd backend && symfony server:start        # http://localhost:8000
cd frontend && npm run dev                # http://localhost:3000
```

The PHP service in `docker-compose.yml` is intentionally commented out — backend runs on the host so Symfony CLI + Doctrine migrations work the way they do locally.

Neither app has a test runner configured. Don't fabricate `npm test` / `phpunit` commands.
