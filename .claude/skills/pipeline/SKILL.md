---
name: pipeline
description: Pipeline complet de développement intransigeant déclenché par `/pipeline <description de tâche>` (ex. `/pipeline ajoute un endpoint GET /api/projects` côté Symfony, `/pipeline fix le bouton de déconnexion qui ne purge pas la session`, `/pipeline refactor le SecurityIpList pour paginer côté serveur`). Enchaîne analyse → implémentation → tests destructifs → PR GitHub → review automatique → boucle de correction. Aucune sortie sans `doctrine:schema:validate` propre (si backend touché), `npm run build` réussi (si frontend touché), smoke tests verts et review VALIDÉ. Usage exclusif quand l'utilisateur invoque `/pipeline`.
---

# `/pipeline` — Pipeline de développement intransigeant

Ce skill prend en entrée la description libre d'une tâche (passée comme argument à `/pipeline`) et exécute un cycle complet de livraison sans compromis. Il ne se termine que quand le code est mergeable et qu'une review automatique a rendu un verdict **VALIDÉ**.

## Règles transversales (s'appliquent à toutes les étapes)

- **Français** partout : commentaires de code, docstrings, messages de commit, titre et description de PR, rapports.
- **Conventional commits FR** : `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`, `style:`. Sujet à l'impératif présent (`feat(backend): ajoute l'endpoint GET /api/user/ips`, `fix(front): corrige le toggle dark mode`).
- **Annonce avant action** : avant chaque tool call non-trivial, dis en une phrase ce que tu vas faire et pourquoi.
- **Aucune validation sans preuve** : un test passe seulement si tu l'as exécuté et observé le résultat. Pas de « ça devrait marcher ».
- **Pas de raccourcis destructeurs** : jamais `--no-verify`, `--force`, `git reset --hard`, `docker compose down -v`, `doctrine:schema:drop`, `rm -rf migrations`, désactivation de hooks. Voir les `deny` de `.claude/settings.json`.
- **Si blocage technique réel** : poser une question précise à l'utilisateur. Ne **JAMAIS** inventer une route, une entité, un service, une variable d'env. Le projet est petit ; tout doit pouvoir se vérifier par `Grep` ou `Read`.
- **Contexte projet à charger** :
  - Stack : Symfony 7.1 (PHP 8.2) + Doctrine ORM 3 + MySQL 9 + Messenger/Scheduler côté backend. Next.js 16 (App Router, JS — pas TS) + NextAuth v4 + Tailwind v4 + Radix + sonner côté frontend.
  - URLs locales : frontend `http://localhost:3000`, backend `http://localhost:8000`, MailHog UI `http://localhost:8025`.
  - DB dev : container `database` (image `mysql:9.1`), exposée sur `DOCKER_MYSQL_PORT` (default `3306`). User `my_user` / `my_password`, schéma `my_database`.
  - Lint/check :
    - Backend : `php bin/console doctrine:schema:validate` (entités ↔ DB en sync) + `php bin/console cache:clear`.
    - Frontend : `npm run lint` puis `npm run build` pour valider la compilation (pas de typecheck — c'est du JS).
  - Voir `CLAUDE.md` à la racine, `backend/CLAUDE.md`, `frontend/CLAUDE.md` et leurs `.claude/rules/*.md` pour l'archi détaillée et les invariants.
- **Skills métier à composer avec celui-ci** quand pertinent : `doctrine-migration`, `i18n-string`, `pending-mail`, `symfony-api-route`, `next-protected-page`. Si la tâche colle à un de ces skills, suis sa procédure dans l'étape 2 plutôt que de tout réinventer.

## Étape 0 — Préparation (avant l'étape 1)

Avant de toucher au code :

1. Identifier le **type** de tâche : `fix` | `feature` | `refactor` | `chore` | `perf` | `docs`.
2. Identifier le **scope** : `backend` (Symfony seul), `frontend` (Next seul), `fullstack` (les deux — typique d'une nouvelle feature de bout en bout).
3. `git status` + `git branch --show-current`. Si la branche actuelle est `main` ou une branche de PR ouverte, créer une nouvelle branche : `git checkout -b <type>/<slug-court-en-snake-case>`.
4. Vérifier que la stack dev tourne :
   ```bash
   docker compose ps
   curl -sI http://localhost:8000/ 2>/dev/null || echo "symfony server pas démarré"
   curl -sI http://localhost:3000/ 2>/dev/null || echo "next dev pas démarré"
   ```
   Si la DB ne tourne pas : `docker compose up -d` (attendre que `database` soit prête). Si les apps ne sont pas lancées : demander à l'utilisateur de lancer `symfony server:start` et `npm run dev` (interactifs, ne pas les démarrer en background depuis le skill).
5. Annoncer à l'utilisateur le **type identifié**, le **scope** et le **plan macro** (les étapes que tu vas suivre). Une seule phrase par étape.

## Étape 1 — Analyse & reproduction

**Livrable obligatoire** : un plan d'action écrit, validé contre la réalité du code, **avant la première modification**. Utilise `templates/plan.md`.

### Pour un `fix` / `bug`

1. Reproduire le bug **avant toute correction**. Outils :
   - `curl -X <METHOD> http://localhost:8000/api/<route>` avec headers/body adéquats. Pour les routes authentifiées : récupérer un JWT via `POST /api/auth/login`, puis `Authorization: Bearer <token>`.
   - Logs : sortie de `symfony server:start` (terminal de l'utilisateur) pour les logs PHP/Doctrine. Sortie de `npm run dev` pour les logs Next.
   - DB read-only :
     ```bash
     docker exec database mysql -umy_user -pmy_password my_database -e "SELECT ... FROM ..."
     ```
   - Mails : interface MailHog `http://localhost:8025` pour vérifier ce qui est parti.
   - Queue mails : `SELECT id, to_email, status, attempts, last_error FROM pending_mails ORDER BY created_at DESC LIMIT 20`.
2. Si la repro nécessite un état (user inscrit, mail en `pending`, IP enregistrée) :
   - User : `POST /api/auth/signup` ou `INSERT` direct si nécessaire.
   - Mail en queue : enqueue manuellement via un curl qui déclenche un event, ou `INSERT` direct dans `pending_mails`.
3. Documenter dans le plan :
   - Étapes exactes pour reproduire (commande curl complète, ou parcours UI).
   - Comportement observé vs attendu (status code + body, ou état UI).
   - Hypothèse de cause racine localisée à `fichier:ligne` (Grep + Read).
4. **Interdit** d'écrire la moindre ligne de fix tant que le bug n'est pas reproduit ET que la cause racine n'est pas identifiée à un emplacement précis.

### Pour une `feature`

1. Cartographier les **points d'intégration** côté concerné :
   - Backend : controllers `Api/`, entités `Entity/`, repos `Repository/`, services `Service/`, listeners `EventListener/`, migrations `migrations/`.
   - Frontend : pages `app/`, composants `components/`, hooks `hooks/`, utils `utils/`, locales `locales/`.
   - Cross : `frontend/src/utils/Api.js` (mapping URLs) + `frontend/src/proxy.js` (matcher routes protégées) + `frontend/src/lib/auth.js` (callbacks JWT/session).
2. Identifier les **dépendances inverses** : `Grep` les imports/usages des fichiers à toucher.
3. Lister les **risques** spécifiques au projet :
   - **Bridge auth** : modifier le shape de `/api/auth/login` (backend) sans update `frontend/src/lib/auth.js` casse le login.
   - **Pipeline mail** : ajouter un envoi de mail = passer par `PendingMailQueue::enqueue()`, jamais `MailerInterface->send()` direct. Référence : `pending-mail` skill.
   - **i18n** : toute string UI = clé ajoutée dans `fr.json` ET `en.json` en une seule passe. Référence : `i18n-string` skill.
   - **Ownership backend** : toute route user-scoped doit filtrer par `'user' => $user` dans le Doctrine repo. Sinon IDOR.
   - **Dark mode** : toute nouvelle surface doit avoir `bg-X dark:bg-Y` / `text-X dark:text-Y`. Pas de page light-only.
   - **Migration Doctrine** : `make:migration` peut générer un `DROP+ADD` pour un rename — toujours relire le fichier généré. Référence : `doctrine-migration` skill.
   - **Page protégée frontend** : ajouter au `matcher` de `frontend/src/proxy.js`, sinon accessible sans auth.
4. Si la feature touche back + front + DB, planifier l'ordre :
   - **Backend** : entité → migration → controller/service → test curl.
   - **Frontend** : url dans `Api.js` → page/composant → matcher dans `proxy.js` → traductions fr+en → smoke UI.

### Pour un `refactor`

1. Cartographier le code existant et **tous** ses consommateurs (`Grep` sur les classes/fonctions/clés touchées).
2. Définir l'invariant à préserver : signature de service, format de réponse JSON, schéma DB, shape de session NextAuth.
3. Planifier en étapes atomiques, chacune devant laisser le projet **bootable** (`doctrine:schema:validate` OK + `npm run build` OK + endpoint principal qui répond toujours).

### Validation de l'étape 1

Le plan doit explicitement répondre à :

- Quels **fichiers** créés / modifiés / supprimés (chemins absolus).
- Quels **smoke tests** (curl backend + parcours UI front) seront pertinents (étape 3).
- Quelle **vérif DB** est nécessaire (lignes attendues dans `user`, `user_login_ips`, `pending_mails`, etc.).
- Quel **risque de régression** et sur quel autre endpoint / page.
- Quel **rollback** si ça casse.

Une fois le plan écrit, l'afficher à l'utilisateur. Pas de « j'ai un plan en tête » — montrer.

## Étape 2 — Implémentation

### Règles strictes

- **Conventions du projet** (déjà documentées) :
  - **Backend** :
    - Controllers `Api/` étendent `ApiAbstractController`, route attribute `#[Route('/api/...')]`.
    - Routes protégées : `JwtAuthService::authenticate($request)` en première ligne, 401 si null. Référence : skill `symfony-api-route`.
    - Ownership : toujours filtrer par `'user' => $user` dans les requêtes Doctrine.
    - IP client : toujours via `IpBanService::getClientIp($request)`, jamais `$request->getClientIp()` direct.
    - Mail : toujours via `PendingMailQueue::enqueue([...])`. Jamais `MailerInterface->send()` direct.
    - Entité avec FK user : `onDelete: 'CASCADE'` côté JoinColumn + relation inverse sur `User` + `orphanRemoval: true`. Référence : skill `doctrine-migration`.
    - Migration : `make:migration` puis **relire** le fichier généré (pattern destructif `DROP COLUMN + ADD COLUMN` pour un rename = à corriger en `CHANGE`).
    - Inputs HTML d'email : `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` sur tout contenu utilisateur.
  - **Frontend** :
    - Composant client (`"use client"` en tête) pour tout ce qui utilise `useState` / `useEffect` / `useSession` / `useTranslation`.
    - Appel backend : `useSession()` → `session.backendToken` → `Authorization: Bearer ${session.backendToken}`. Référence : skill `next-protected-page`.
    - Nouvelle URL backend : ajoutée dans `frontend/src/utils/Api.js` sous `Urls.<scope>.<key>`.
    - Nouvelle page protégée : ajoutée au `matcher` de `frontend/src/proxy.js`.
    - Strings UI : aucune en dur, toujours `t("namespace.key")`. Clés dans `fr.json` ET `en.json`. Référence : skill `i18n-string`.
    - Dark mode : paires `bg-X dark:bg-Y`, `text-X dark:text-Y`, `border dark:border-slate-800`. Exception : Sidebar + mobile topbar permanents en `bg-slate-900`.
    - Toasts : `import { toast } from "sonner"`, déjà mounted globalement.
- **Auth** :
  - Routes API backend user-scoped : `JwtAuthService::authenticate` puis ownership Doctrine.
  - Pages frontend protégées : inscription au `matcher` du `proxy.js`.
  - Logout : `signOut({ redirect: false })` puis `router.push('/auth')` + `router.refresh()`. Pattern dans `Sidebar.jsx`.
- **Commentaires français** sur les fonctions exportées non triviales. Pour les services Symfony, docstring PHPDoc minimal (`@param`, `@return`).
- **Code auto-documenté** : noms explicites en anglais (variables, fonctions, types/classes), fonctions courtes (< 50 lignes idéalement), responsabilité unique.
- **Aucun déchet** :
  - Pas de `console.log` oublié côté front. `console.error`/`console.warn` ok dans les catch légitimes.
  - Pas de `dump()`, `var_dump`, `dd()` oublié côté back.
  - Pas de TODO / FIXME sans note dans la PR.
  - Pas de code mort, pas d'`import`/`use` inutile.
- **Gestion d'erreurs exhaustive** :
  - Backend : try/catch global dans le controller, retour `$this->json(['error' => '...'], Response::HTTP_<CODE>)` avec message FR.
  - Frontend : toast d'erreur via `toast.error(t("..."))`, jamais d'alert ou console silencieux.
  - Pas de `catch {}` vide. Pas de `catch (\Throwable $e) {}` sans log.
- **Pas de feature flag improvisé**, pas de shim de compatibilité non demandé.

### Pendant l'écriture

- `Edit` sur les fichiers existants, `Write` uniquement pour les nouveaux.
- Après chaque fichier touché, te poser : « est-ce que cette modif respecte la checklist ci-dessus ? ». Si non, corriger avant de passer au suivant.
- Si tu crées un nouveau pattern (helper, abstraction), vérifier qu'il n'existe pas déjà ailleurs (`Grep` sur le repo).

### Validation de l'étape 2

```bash
# Backend
cd backend
php bin/console doctrine:schema:validate
php bin/console cache:clear

# Si une migration a été générée
php bin/console doctrine:migrations:migrate --no-interaction

# Frontend (si touché)
cd ../frontend
npm run lint
npm run build
```

`doctrine:schema:validate` doit retourner « in sync ». `npm run build` doit retourner exit 0. Si une migration a été appliquée, `doctrine:migrations:status` doit montrer tout en `Applied`.

## Étape 3 — Tests destructifs

Posture mentale : **tu attaques ta propre implémentation**. Objectif : la casser. Si tu n'arrives pas à la casser après avoir épuisé les vecteurs ci-dessous, alors elle est validée.

Utilise `templates/tests-report.md`. Un test passe seulement si tu décris l'action exacte (commande `curl` ou parcours UI), l'attente et l'observation.

### Vecteurs obligatoires à couvrir

#### A. Auth & autorisation

- **Route API backend protégée sans `Authorization` header** : 401 JSON.
- **Route API backend avec JWT d'un autre user** (cross-user) : 404 (la ressource n'existe pas pour cet user). Si 200, c'est une faille IDOR — ❌.
- **Route API backend avec JWT expiré / corrompu** : 401.
- **Page frontend protégée sans session NextAuth** (`/dashboard`, `/history`, `/ideas`, `/settings`, `/editor`) : redirect vers `/auth` via `proxy.js`.
- **Login avec credentials valides** : `session.backendToken` est défini côté `useSession()`.

#### B. Validation des inputs

- Champs requis manquants → 400 avec body `{ error: "..." }`.
- Mauvais type (string au lieu d'int, enum invalide) → 400 ou 422.
- Payload géant : 1 Mo dans une description.
- Caractères spéciaux : emoji, RTL, null bytes, quotes — vérifier persist + render échappé.
- JSON corrompu (`{"a":`) → 400 propre, pas de 500.
- Email invalide à l'inscription → 422 avec message Symfony Validator.

#### C. Sécurité

- **IDOR / cross-user** : créer 2 comptes A et B. Avec le JWT de B, tenter `GET /api/<resource>/<id_de_A>` → doit être 404, pas 200. Idem sur toutes les routes user-scoped.
- **XSS dans un mail** : créer un user avec `name = "<script>alert(1)</script>"`, déclencher le welcome email, vérifier dans MailHog que le `<script>` est échappé en `&lt;script&gt;` dans le HTML envoyé. Si pas échappé → ❌.
- **XSS dans l'UI** : nom de profil avec `<script>` — React échappe par défaut tout enfant text. Vérifier qu'il n'y a pas de `dangerouslySetInnerHTML` introduit.
- **SQL injection** : Doctrine paramètre via DQL/QueryBuilder. Si une route utilise `$em->getConnection()->executeQuery()` avec concat string, c'est une faille. `grep -rn "executeQuery\|executeStatement" backend/src/` doit montrer uniquement des paramètres `?` ou nommés.
- **Secrets dans logs / commit** : grep le repo pour `JWT_SECRET=`, `password=`, `Bearer ey` dans les fichiers commités (hors `.env.example`). `grep -rnE "(password|secret|api[_-]?key|JWT_SECRET)\s*[:=]\s*['\"][^\"']{12,}" backend/src/ frontend/src/` doit être vide.
- **IP ban** : insérer une `BannedIp` correspondant à ton IP, tenter une requête `/api/...` → 403.

#### D. Concurrence

- **Double signup avec le même email** : 1ère réussit, 2ème renvoie 409 `Cet email est déjà utilisé.`
- **Double inscription IP** : le `UserLoginIpRecorder` fait un `findOneByUserAndIp` puis update si présent. Connecte-toi deux fois consécutives → une seule ligne en DB, `last_seen_at` bumpé.
- **Mail processor lock** : `php bin/console app:mail:process` lance le batch ; pendant qu'il tourne, en lancer un second en parallèle. Le second ne doit pas re-traiter les mêmes mails (status `processing` les exclut du `findPendingBatch`).
- **Scheduler concurrent** : si tu démarres `messenger:consume scheduler_mail` en parallèle d'un `app:mail:process` manuel, pas de double envoi (même lock optimiste).

#### E. Edge cases métier

- **Échec d'envoi mail** : couper MailHog (`docker compose stop mailer`), enqueue un mail, lancer `app:mail:process` — le mail doit passer en `pending` (retry) avec `attempts=1` et `last_error` peuplé. Refaire 2 fois → `failed` au 3ème.
- **Locale switch FR↔EN** : ouvrir `/dashboard`, passer en EN via Settings → Préférences, naviguer toutes les pages protégées — aucune string FR ne doit subsister. Idem retour FR.
- **Dark mode toggle** : passer en dark, ouvrir chaque page (`/`, `/auth`, `/dashboard`, `/history`, `/ideas`, `/editor`, `/settings`) — aucune surface blanche illisible.
- **Empty states** : nouveau compte sans IP enregistrée → `/settings` onglet Sécurité affiche message « Aucune connexion enregistrée ».
- **Logout puis re-login** : pas de cookie résiduel, le `session.backendToken` est refresh.

#### F. Persistance

- Après signup : `SELECT id, email, last_login FROM user WHERE email='<email>'` → user créé, `last_login` null tant que pas connecté.
- Après login : `SELECT last_login FROM user WHERE email='<email>'` → `last_login` peuplé. Et `SELECT ip_address, last_seen_at FROM user_login_ips WHERE user_id=<id>` → 1 ligne.
- Re-login depuis la même IP : `SELECT COUNT(*) FROM user_login_ips WHERE user_id=<id>` → toujours 1, `last_seen_at` bumpé.
- Après envoi mail OK : `SELECT status, sent_at, attempts FROM pending_mails WHERE id=<id>` → `status='sent'`, `sent_at` non null, `attempts=1`.
- Après échec mail (retries épuisés) : `SELECT status, attempts, last_error FROM pending_mails WHERE id=<id>` → `status='failed'`, `attempts=3`, `last_error` peuplé.
- Suppression user : `DELETE FROM user WHERE id=<id>` → `user_login_ips` du user sont supprimés en cascade (FK `ON DELETE CASCADE`).

### Outillage

```bash
# Stack dev
docker compose ps
docker compose logs --tail=100 database
docker compose logs --tail=100 mailer

# DB read-only
docker exec database mysql -umy_user -pmy_password my_database -e "SHOW TABLES;"
docker exec database mysql -umy_user -pmy_password my_database -e "SELECT id, email FROM user;"
docker exec database mysql -umy_user -pmy_password my_database -e "SELECT id, status, attempts, last_error FROM pending_mails ORDER BY created_at DESC LIMIT 20;"

# Test auth flow
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test A","email":"a@test.local","password":"changeme1"}'

TOKEN_A=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.local","password":"changeme1"}' | jq -r .token)

curl -H "Authorization: Bearer $TOKEN_A" http://localhost:8000/api/user/ips

# Forcer un tick du scheduler
cd backend && php bin/console app:mail:process --batch-size=50

# MailHog inspection
curl http://localhost:8025/api/v2/messages | jq '.items[] | {From, To, Subject}'
```

### Règle absolue

**Si UN SEUL test échoue ou produit un comportement non documenté, retour à l'étape 2.** Pas de « c'est un edge case ignorable », pas de « on verra plus tard ». Corriger, puis rejouer **tous** les tests, pas seulement celui qui a échoué (régression possible).

### Validation de l'étape 3

Le rapport `templates/tests-report.md` est rempli :
- Au moins un test par vecteur applicable au scope de la tâche.
- Chaque ligne a action / attente / observation / verdict.
- Tous les verdicts sont ✅. Aucun ❌.

Affiche le rapport rempli à l'utilisateur avant de passer à l'étape 4.

## Étape 4 — Pull Request GitHub

### Préparation

1. `git status` — confirmer que seuls les fichiers prévus dans le plan sont modifiés.
2. `git diff` — relire l'intégralité du diff. Chercher : `console.log`/`var_dump`/`dd()` oubliés, secrets en dur, formatage cassé, imports inutiles.
3. `git add <fichiers explicites>` — **jamais** `git add .` ni `git add -A`. `.env` est dans `.gitignore` mais d'autres artefacts (logs, var/cache) peuvent traîner.
4. `git commit` avec message conventional commits FR :
   ```
   <type>(<scope optionnel>): <sujet à l'impératif présent>

   <corps optionnel — pourquoi, pas quoi>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```
   Scopes courants : `backend`, `frontend`, `auth`, `mail`, `i18n`, `theme`, `db`, `infra`.
5. Push : `git push -u origin <branche>`.

### Création de la PR

Utiliser `gh pr create` avec le template `templates/pr-body.md` rempli.

- **Titre** : conventional commits FR, < 70 caractères. Pas de mention IA dans le titre.
- **Description** : remplir TOUTES les sections du template. Concis, factuel, actionnable.

### Validation de l'étape 4

`gh pr create` retourne une URL. L'afficher à l'utilisateur. **Ne pas merger** — la PR est à reviewer.

## Étape 5 — Review automatique

Lancer un agent de review via `Agent(subagent_type: "fullstack-code-reviewer")`. L'agent est défini dans `.claude/agents/fullstack-code-reviewer.md` ; il a accès à `Bash`, `Read`, `Grep`, `Glob`.

### Prompt de review (à adapter)

```
Tu reviewes la PR #<numéro> de ce monorepo Symfony + Next.js, branche <branche>.

Fichiers modifiés :
<liste git diff --name-only main...HEAD>

Charge CLAUDE.md à la racine + .claude/rules/*.md pour les invariants cross-cutting.
Charge backend/CLAUDE.md + backend/.claude/rules/*.md si le diff touche backend/.
Charge frontend/CLAUDE.md + frontend/.claude/rules/*.md si le diff touche frontend/.

Suis ta grille (🔴 / 🟠 / 🟡) et rends ton rapport selon le template
.claude/skills/pipeline/templates/review-report.md.

Si une seule entrée 🔴 ou 🟠, verdict REJETÉ.
```

### Pendant la review

- Pendant que l'agent tourne, ne fais rien — n'anticipe pas, ne pré-corrige pas. Laisse-le finir.
- Quand il rend son rapport, le copier dans la conversation et l'attacher à la PR :
  ```bash
  gh pr comment <numéro> --body "$(cat /tmp/review-report.md)"
  ```

### Validation de l'étape 5

Verdict de la review. Si **VALIDÉ**, conclure. Si **REJETÉ**, étape 6.

## Étape 6 — Boucle de correction

1. Lister les points 🔴 et 🟠 du rapport.
2. Pour chaque point : retour à l'étape 2 (implémentation), correction ciblée.
3. Re-`doctrine:schema:validate` et/ou `npm run build` après chaque modif.
4. Re-jouer **l'intégralité** des tests destructifs de l'étape 3 (régression possible). Mettre à jour `tests-report.md`.
5. Pousser un nouveau commit : `fix(review): <résumé>` (toujours conventional commits FR).
6. Re-lancer un agent de review (étape 5) avec le contexte mis à jour.
7. Boucler jusqu'à verdict **VALIDÉ**.

**Aucune limite d'itérations.** On sort uniquement quand la review passe sans 🔴 ni 🟠.

### Conclusion

Une fois VALIDÉ :

1. Afficher à l'utilisateur :
   - URL de la PR.
   - Résumé : nombre de commits, nombre d'itérations review, fichiers touchés.
   - Le rapport de review final.
2. **Ne pas merger** — décision humaine.

## Templates disponibles

- `templates/plan.md` — plan d'action de l'étape 1.
- `templates/tests-report.md` — rapport de tests destructifs de l'étape 3.
- `templates/pr-body.md` — description de PR de l'étape 4.
- `templates/review-report.md` — rapport de review de l'étape 5.

## Anti-patterns à éviter absolument

- ❌ « J'ai testé mentalement, ça devrait marcher » → tu dois `curl` / cliquer et observer le status + body / l'écran.
- ❌ « Le test échoue mais c'est un edge case » → c'est précisément ce qu'on teste.
- ❌ « Je fais le commit et la PR maintenant pour gagner du temps » → l'étape 3 n'est pas négociable.
- ❌ « Je supprime ce test qui passe pas » → tu corriges le code, pas le test.
- ❌ « Je modifie en silence un fichier non prévu » → si ça sort du plan, tu re-fais le plan.
- ❌ « L'agent de review est trop sévère » → c'est le but. Tu corriges.
- ❌ « Je merge moi-même la PR » → jamais. Décision humaine.
- ❌ « Je commit `.env` » → vérifier `git status` AVANT chaque `git add`. `.env` est gitignoré mais une frappe distraite reste possible.
- ❌ « Je rajoute la string EN seulement, je ferai FR plus tard » → les 2 fichiers en une passe, sinon clé manquante côté UI.
- ❌ « J'envoie le mail directement via MailerInterface, c'est plus rapide » → jamais. Toujours `PendingMailQueue::enqueue()`.
- ❌ « J'oublie le matcher du `proxy.js` pour la nouvelle page » → la page sera publique. Bug critique.
- ❌ « Je copie-colle une route API sans `JwtAuthService::authenticate` » → IDOR garanti.
