# Rapport de tests destructifs — `<titre tâche>`

Branche : `<nom-de-branche>`
Date : `<YYYY-MM-DD>`
Scope : `backend` | `frontend` | `fullstack`

## Préparation

```bash
BACK=http://localhost:8000
FRONT=http://localhost:3000

# Comptes de test
USER_A_EMAIL=a@test.local
USER_B_EMAIL=b@test.local

# Inscription + login pour récupérer un JWT
curl -X POST $BACK/api/auth/signup -H "Content-Type: application/json" \
  -d "{\"name\":\"User A\",\"email\":\"$USER_A_EMAIL\",\"password\":\"changeme1\"}"

TOKEN_A=$(curl -s -X POST $BACK/api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_A_EMAIL\",\"password\":\"changeme1\"}" | jq -r .token)

TOKEN_B=$(curl -s -X POST $BACK/api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_B_EMAIL\",\"password\":\"changeme1\"}" | jq -r .token)

DB="docker exec database mysql -umy_user -pmy_password my_database -e"
```

## A. Auth & autorisation

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| A1 | `curl $BACK/api/user/ips` (sans Authorization) | 401 JSON `{ error: "Non authentifié." }` | <observé> | ✅ / ❌ |
| A2 | `curl -H "Authorization: Bearer $TOKEN_B" $BACK/api/<resource de A>` | 404 ou items vides (pas d'accès aux données de A) | <observé> | ✅ / ❌ |
| A3 | `curl -H "Authorization: Bearer invalid" $BACK/api/user/ips` | 401 | <observé> | ✅ / ❌ |
| A4 | `curl -sI $FRONT/dashboard` (sans cookie NextAuth) | 307 redirect vers `/auth` | <observé> | ✅ / ❌ |
| A5 | Login UI avec credentials valides → ouvrir DevTools → vérifier `useSession()` | `session.backendToken` défini | <observé> | ✅ / ❌ |

## B. Validation des inputs

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| B1 | `POST /api/auth/login` body `{}` | 400 « Email et mot de passe requis. » | <observé> | ✅ / ❌ |
| B2 | `POST /api/auth/signup` avec email `"pas un email"` | 422 (Symfony Validator refuse) | <observé> | ✅ / ❌ |
| B3 | `POST /api/auth/signup` avec password de 3 chars | 422 (min length) | <observé> | ✅ / ❌ |
| B4 | Caractères spéciaux : nom user `🐺<script>RTL` | persisté, render échappé côté UI | <observé> | ✅ / ❌ |
| B5 | JSON corrompu (`{"email":`) sur une route POST | 400 propre, pas de 500 | <observé> | ✅ / ❌ |
| B6 | Inscription avec un email déjà pris | 409 « Cet email est déjà utilisé. » | <observé> | ✅ / ❌ |

## C. Sécurité

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| C1 | IDOR : `B` requête une ressource user-scoped de `A` | 404 ou items vides | <observé> | ✅ / ❌ |
| C2 | XSS mail : signup avec name `<script>alert(1)</script>`, vérifier MailHog | `&lt;script&gt;` dans le HTML (échappé via `htmlspecialchars`) | <observé> | ✅ / ❌ |
| C3 | XSS UI : nom de profil avec `<script>` rendu dans une page | text échappé par React, pas d'exécution JS | <observé> | ✅ / ❌ |
| C4 | `grep -rnE "(password\|secret\|api[_-]?key\|JWT_SECRET)\s*[:=]\s*['\"][^\"']{12,}" backend/src/ frontend/src/` | aucun match (sauf placeholders dans `.env.example`) | <observé> | ✅ / ❌ |
| C5 | `grep -rn "executeQuery\|executeStatement" backend/src/` (SQL brut) | uniquement avec paramètres, pas de concat string | <observé> | ✅ / ❌ |
| C6 | IP ban : `INSERT INTO banned_ips (...)` matchant ton IP → curl `/api/auth/login` | 403 JSON `Votre adresse IP est bannie.` | <observé> | ✅ / ❌ |

## D. Concurrence

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| D1 | Double signup avec le même email en parallèle | 1× 201 (créé), 1× 409 (conflit) | <observé> | ✅ / ❌ |
| D2 | Double login depuis la même IP | 1 seule ligne dans `user_login_ips`, `last_seen_at` bumpé | <observé> | ✅ / ❌ |
| D3 | `app:mail:process` lancé 2 fois en parallèle (avec 100 mails pending) | aucun mail envoyé en double (lock optimiste via status `processing`) | <observé> | ✅ / ❌ |
| D4 | `messenger:consume scheduler_mail` + `app:mail:process` manuel simultanés | idem, aucun envoi en double | <observé> | ✅ / ❌ |

## E. Edge cases métier

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| E1 | Couper MailHog (`docker compose stop mailer`) puis enqueue + tick × 3 | mail en `failed` après 3 tentatives, `last_error` peuplé | <observé> | ✅ / ❌ |
| E2 | Redémarrer MailHog puis enqueue un nouveau mail | `sent` au prochain tick (le scheduler reprend) | <observé> | ✅ / ❌ |
| E3 | Locale switch : FR → EN via Settings → Préférences → naviguer toutes les pages protégées | aucune string FR visible | <observé> | ✅ / ❌ |
| E4 | Locale switch retour EN → FR | aucune string EN visible | <observé> | ✅ / ❌ |
| E5 | Dark mode : activer dans Settings → Préférences → ouvrir `/`, `/auth`, `/dashboard`, `/history`, `/ideas`, `/editor`, `/settings` | aucune surface blanche illisible | <observé> | ✅ / ❌ |
| E6 | Empty state Settings → Sécurité avec un compte fraîchement créé sans login antérieur | message « Aucune connexion enregistrée » | <observé> | ✅ / ❌ |
| E7 | Logout depuis Sidebar → vérifier `useSession().status === "unauthenticated"` | redirect `/auth`, plus de `backendToken` | <observé> | ✅ / ❌ |

## F. Persistance

| # | Action | Attente | Observation | Verdict |
|---|---|---|---|---|
| F1 | Après signup : `$DB "SELECT id, email, last_login FROM user WHERE email='$USER_A_EMAIL'"` | user créé, `last_login` NULL | <observé> | ✅ / ❌ |
| F2 | Après login : `$DB "SELECT last_login FROM user WHERE email='$USER_A_EMAIL'"` | `last_login` non NULL | <observé> | ✅ / ❌ |
| F3 | Après login : `$DB "SELECT ip_address, event, attempts FROM user_login_ips WHERE user_id=<id>"` | 1 ligne, `event='login'` | <observé> | ✅ / ❌ |
| F4 | Re-login : `$DB "SELECT COUNT(*) FROM user_login_ips WHERE user_id=<id>"` | toujours 1, `last_seen_at` bumpé | <observé> | ✅ / ❌ |
| F5 | Après envoi mail OK : `$DB "SELECT status, sent_at, attempts FROM pending_mails ORDER BY id DESC LIMIT 1"` | `sent`, `sent_at` non NULL, `attempts=1` | <observé> | ✅ / ❌ |
| F6 | Après 3 échecs : `$DB "SELECT status, attempts, last_error FROM pending_mails WHERE id=<id>"` | `failed`, `attempts=3`, `last_error` peuplé | <observé> | ✅ / ❌ |
| F7 | `$DB "DELETE FROM user WHERE id=<id>"` puis `SELECT COUNT(*) FROM user_login_ips WHERE user_id=<id>` | 0 (cascade FK) | <observé> | ✅ / ❌ |

## Résultat global

- **Vecteurs couverts** : A, B, C, D, E, F (cocher les applicables au scope de la tâche)
- **Tests passés** : `<n>/n`
- **Tests échoués** : `0` (sinon → retour étape 2)

✅ **Tous verts.** Pipeline → étape 4.
