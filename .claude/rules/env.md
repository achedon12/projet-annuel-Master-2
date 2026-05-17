# Environment files

Three `.env` files, non-overlapping roles:

- `./.env` — only `MYSQL_*` and `DOCKER_MYSQL_PORT`. Consumed by docker-compose, nothing else.
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `MAILER_DSN`, `MESSENGER_TRANSPORT_DSN`, `CORS_ALLOW_ORIGIN`.
- `frontend/.env` — `NEXT_PUBLIC_API_URL` (backend base URL, e.g. `http://localhost:8000`), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

The backend `DATABASE_URL` defaults to Docker hostname `database`. If you run PHP on the host (not in the container), switch to the commented `127.0.0.1` line in `backend/.env`.
