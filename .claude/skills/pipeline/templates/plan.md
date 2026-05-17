# Plan d'action — `<titre court de la tâche>`

## Type
`fix` | `feature` | `refactor` | `chore` | `perf` | `docs`

## Scope
`backend` | `frontend` | `fullstack`

## Contexte
<2-3 phrases : pourquoi cette tâche, quel besoin elle adresse, comment elle s'inscrit dans le projet>

## Reproduction (uniquement pour `fix`)

### Étapes
1. <commande curl complète OU parcours UI précis>
2. <ou requête SQL pour mettre la DB dans un état précis>
3. <observation>

### Comportement observé vs attendu
- **Observé** : `HTTP <code>` — `<body>` (ou écran/console)
- **Attendu** : `HTTP <code>` — `<body>` (ou écran/console)

### Cause racine
- **Localisation** : `<fichier>:<ligne>`
- **Explication** : <1-2 phrases>

## Cartographie (pour `feature` / `refactor`)

### Surface touchée

#### Backend
- [ ] Controllers (`backend/src/Controller/Api/...`)
- [ ] Entités + repositories (`backend/src/Entity/...`, `backend/src/Repository/...`)
- [ ] Services (`backend/src/Service/...`)
- [ ] Listeners (`backend/src/EventListener/...`)
- [ ] Messages / Handlers (`backend/src/Message/...`, `backend/src/MessageHandler/...`)
- [ ] Scheduler (`backend/src/Scheduler/...`)
- [ ] Migration Doctrine (`backend/migrations/Version*.php`)
- [ ] Config (`backend/config/...`, `backend/.env`)

#### Frontend
- [ ] Pages (`frontend/src/app/<route>/page.jsx`)
- [ ] Composants (`frontend/src/components/...`)
- [ ] Hooks / context (`frontend/src/hooks/`, `frontend/src/context/`)
- [ ] Utils (`frontend/src/utils/Api.js` pour les URLs)
- [ ] Locales (`frontend/src/locales/{fr,en}.json`)
- [ ] proxy.js (matcher de routes protégées)
- [ ] Auth bridge (`frontend/src/lib/auth.js`)
- [ ] Styles / thème (`frontend/src/app/styles/...`)

### Fichiers à toucher

| Action | Chemin | Rôle |
|---|---|---|
| Créer | `backend/src/...` | <pourquoi> |
| Modifier | `frontend/src/...` | <quoi changer> |
| Supprimer | `<path>` | <pourquoi> |

### Schéma Doctrine

- [ ] Aucune modif
- [ ] Nouvelle entité : `<Entity>`
- [ ] Modification d'une entité existante : `<Entity>` (ajout colonne / index / relation)
- [ ] Migration générée via `php bin/console make:migration` (cocher après vérif manuelle qu'elle ne fait pas de `DROP+ADD` pour un rename — référence : skill `doctrine-migration`).

### Routes API ajoutées / modifiées

| Méthode | URL | Controller | Auth |
|---|---|---|---|
| POST | `/api/...` | `Api\\MyController::create` | `JwtAuthService::authenticate` + ownership |
| GET | `/api/...` | `Api\\MyController::list` | `JwtAuthService::authenticate` + filter par user |

### Pages frontend ajoutées / modifiées

| Route | Type | Fichier | Auth |
|---|---|---|---|
| `/mypage` | client (`"use client"`) | `frontend/src/app/mypage/page.jsx` | ajouter `/mypage/:path*` au matcher de `frontend/src/proxy.js` |

### URLs ajoutées à `Api.js`

```js
export const Urls = {
    auth: { … },
    user: { ips: '/user/ips' },
    // <ajouts ici>
};
```

### Traductions ajoutées

| Clé | FR | EN |
|---|---|---|
| `mypage.title` | `<fr>` | `<en>` |
| `mypage.subtitle` | `<fr>` | `<en>` |

### Mails envoyés

- [ ] Aucun
- [ ] Nouveau flux : event `<X>` déclenche listener `<Y>` qui appelle `PendingMailQueue::enqueue(...)`. Subject : `<...>`. Template : inline HTML avec `htmlspecialchars` sur l'input utilisateur.

### Persistance attendue

- `<table>` : <colonnes remplies sur succès>
- `pending_mails` impacté ? (si oui détailler le flow attendu : `pending` → `processing` → `sent`)
- `user_login_ips` impacté ? (création ou update de `last_seen_at`)

## Risques de régression

- <feature existante 1> qui dépend de `<fichier>:<ligne>` modifié.
- <feature existante 2> qui consomme `<service>` refactorisé.
- **Bridge auth** : si le shape de `/api/auth/login` change, `frontend/src/lib/auth.js` doit suivre.
- **Pipeline mail** : si tu modifies `PendingMailProcessor` ou `MailSchedule`, les autres flows mail (welcome, etc.) ne doivent pas casser.
- **i18n** : si tu renommes une clé, `grep` toutes ses occurrences avant de la retirer.

## Tests destructifs prévus

(détaillés dans `tests-report.md` à l'étape 3)

- [ ] Auth : sans JWT / JWT d'un autre user / page protégée sans session
- [ ] Validation : champs requis manquants / types invalides / payload géant / JSON corrompu
- [ ] Sécurité : IDOR backend / XSS dans les mails / SQL injection / secrets dans logs / IP ban
- [ ] Concurrence : double signup / double login depuis même IP / mail processor en parallèle
- [ ] Edge cases : échec d'envoi mail (retry × 3 → failed) / locale switch FR↔EN / dark mode toggle / empty states
- [ ] Persistance : transitions `pending_mails.status` / `user_login_ips.last_seen_at` bump / cascade delete user

## Rollback

Si la modif casse en prod :

1. `git revert <sha>`.
2. Si modif Doctrine appliquée : créer une **nouvelle** migration `Down` qui défait les changements (jamais éditer une migration commitée).
3. Si modif `pending_mails` corrompue : `UPDATE pending_mails SET status='failed' WHERE …` pour stopper la retentation.
