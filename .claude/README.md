# `.claude/` — Configuration projet pour Claude Code

Ce dossier contient les règles d'architecture, les skills et les agents spécifiques au projet pour Claude Code.

## Layout

- `settings.json` — pré-autorise les commandes courantes (composer, php bin/console, symfony, docker compose, npm, git, gh) et bloque les destructives (`rm -rf`, `down -v`, `DROP DATABASE`, `force push`, `reset --hard`, `doctrine:migrations:migrate --no-interaction` non scopé). Les autres déclenchent un prompt normal.
- `settings.local.json` — préférences personnelles (non versionnées).
- `rules/` — règles cross-cutting (commands, auth-bridge, env). Les règles spécifiques à un sous-projet vivent dans `backend/.claude/rules/` et `frontend/.claude/rules/`, chargées automatiquement quand on travaille dans le dossier correspondant.
- `skills/` — skills déclenchables. Chaque sous-dossier a un `SKILL.md` avec frontmatter (`name`, `description`). Claude active automatiquement quand la description matche la demande.
- `agents/` — sous-agents spécialisés. Invoqués via `Agent(subagent_type: "<name>")` (ou explicitement par l'utilisateur).

## Skills disponibles

| Skill | Déclenche sur |
|---|---|
| `pipeline` | Slash command `/pipeline <description>` — pipeline complet intransigeant : analyse → implémentation → tests destructifs → PR → review automatique → boucle de correction. Templates sous `pipeline/templates/`. Connaît les deux stacks (Symfony + Next). |
| `i18n-string` | Ajouter/renommer/supprimer une chaîne UI côté frontend. Couvre les 2 catalogues `src/locales/{fr,en}.json` à garder en lockstep, le hook custom `useTranslation()` (PAS next-intl), et l'interpolation `{var}`. |
| `pending-mail` | Ajouter un nouveau flux email côté backend. Couvre la règle « jamais `MailerInterface` direct », `PendingMailQueue::enqueue()`, le format HTML attendu, et le déclenchement automatique par le scheduler. |
| `doctrine-migration` | Modifier le schéma Doctrine — ajouter une entité, une colonne, un index. Couvre `make:migration` (diff-based), la relation inverse côté `User`, la convention des noms de tables (snake_case pluriel), et les pièges avec MySQL 9. |
| `symfony-api-route` | Ajouter ou modifier un controller sous `src/Controller/Api/`. Couvre `JwtAuthService::authenticate()` pour les routes protégées, le format JSON, l'usage de `IpBanService::getClientIp()`, et les codes HTTP idiomatiques. |
| `next-protected-page` | Ajouter une page protégée côté frontend. Couvre l'inscription dans le matcher `proxy.js`, le pattern `useSession()` + `session.backendToken` pour appeler le backend, le wiring du dark mode, et le doublon FR/EN. |

## Agents disponibles

| Agent | Rôle |
|---|---|
| `fullstack-code-reviewer` | Reviewer intransigeant qui connaît les deux stacks. Vérifie le bridge JWT/NextAuth, l'ownership backend, la validation des inputs, l'i18n complète FR+EN, la règle « jamais `MailerInterface` direct », le dark mode, les codes HTTP, la cohérence du `proxy.js`. Ne modifie rien — rend un verdict VALIDÉ / REJETÉ avec emplacements `fichier:ligne`. À invoquer avant commit/PR. |

L'architecture détaillée vit dans :
- `CLAUDE.md` racine (et `.claude/rules/`)
- `backend/CLAUDE.md` (et `backend/.claude/rules/`)
- `frontend/CLAUDE.md` (et `frontend/.claude/rules/`)

Les skills et agents supposent ce contexte chargé.
