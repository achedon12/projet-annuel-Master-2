## Résumé

<2-3 phrases : ce que la PR change et pourquoi (le « pourquoi », pas le « quoi » — le diff montre le quoi).>

## Type
- [ ] `feat` — nouvelle fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `refactor` — refonte sans changement de comportement
- [ ] `chore` — maintenance (deps, config)
- [ ] `perf` — perf
- [ ] `docs` — doc

## Scope
- [ ] `backend` (Symfony)
- [ ] `frontend` (Next.js)
- [ ] `fullstack`

## Surface touchée

### Backend
- [ ] Controllers (`backend/src/Controller/Api/...`)
- [ ] Entités + migrations
- [ ] Services (`backend/src/Service/...`)
- [ ] Listeners / Messages / Scheduler
- [ ] Config (`backend/config/...`)

### Frontend
- [ ] Pages (`frontend/src/app/...`)
- [ ] Composants (`frontend/src/components/...`)
- [ ] `proxy.js` (matcher)
- [ ] `lib/auth.js` (bridge NextAuth)
- [ ] Locales (`frontend/src/locales/{fr,en}.json`)
- [ ] Theme / styles

## Schéma Doctrine

- [ ] Aucune modif
- [ ] Migration appliquée — fichier : `backend/migrations/Version<YYYYMMDDHHMMSS>.php`. Réversible ? OUI/NON.

```sql
-- résumé des changements (extrait du fichier de migration)
```

## Routes touchées

### Backend

| Méthode | URL | Controller | Auth | Note |
|---|---|---|---|---|
| POST | `/api/...` | `Api\\MyController::create` | `JwtAuthService::authenticate` + ownership | <note> |

### Frontend

| Route | Type | Auth |
|---|---|---|
| `/mypage` | client | matcher dans `proxy.js` |

## Bridge auth touché ?

- [ ] Non
- [ ] Oui — le shape de `/api/auth/login` ou `/api/auth/signup` a changé. `frontend/src/lib/auth.js` a été mis à jour pour parser le nouveau payload.

## Smoke tests joués

(résumé du `tests-report.md` — détails dans le commit ou en commentaire de PR)

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"a@test.local","password":"changeme1"}' | jq -r .token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/user/ips
```

- ✅ Auth : sans JWT / cross-user / IP bannie
- ✅ Validation : Symfony Validator (champs / types / size)
- ✅ Sécurité : IDOR / XSS dans mails (escape) / secrets pas en clair / SQL paramétré
- ✅ Concurrence : double signup / mail processor parallèle
- ✅ Persistance : `user_login_ips.last_seen_at` bump, `pending_mails` transitions sent/failed, cascade delete

## i18n

- [ ] Aucune string ajoutée
- [ ] Clés ajoutées dans `frontend/src/locales/fr.json` ET `frontend/src/locales/en.json` simultanément (cocher les 2)

## Theming

- [ ] N/A (pas de changement UI)
- [ ] Toutes les nouvelles surfaces ont des paires `light dark:` (`bg-slate-50 dark:bg-slate-950`, `text-slate-600 dark:text-slate-400`, etc.)
- [ ] Toggle dark mode vérifié dans Settings → Préférences

## Mail

- [ ] Aucun nouvel envoi
- [ ] Nouveau flux email passe par `PendingMailQueue::enqueue(...)` (jamais `MailerInterface->send()` direct)
- [ ] Contenu utilisateur dans le HTML protégé par `htmlspecialchars`

## Build & validations

- ✅ `php bin/console doctrine:schema:validate` — in sync
- ✅ `cd frontend && npm run lint` — exit 0
- ✅ `cd frontend && npm run build` — exit 0
- ✅ `php bin/console doctrine:migrations:status` — all Applied (si migration appliquée)

## Rollback

```bash
git revert <sha>

# Si migration Doctrine appliquée — créer une migration "Down"
php bin/console make:migration
# éditer manuellement pour annuler les changements
php bin/console doctrine:migrations:migrate
```

## Points d'attention pour le reviewer

- <fichier:ligne> : décision non-évidente expliquée ici
- <invariant à conserver vs liberté qu'on s'autorise>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
