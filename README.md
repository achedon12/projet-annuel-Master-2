# Générateur de contenu SEO assisté par IA

Plateforme de génération et de gestion d'articles optimisés SEO. Monorepo composé
de deux applications :

- **`backend/`** — API JSON Symfony 7.1 (PHP 8.2+, Doctrine ORM 3, MySQL 9, Messenger + Scheduler).
- **`frontend/`** — Client Next.js 16 (App Router, React 19, NextAuth, Tailwind v4).

L'authentification repose sur un pont JWT : NextAuth appelle `POST /api/auth/login`
côté Symfony et réutilise le token renvoyé pour les appels aux routes protégées.

---

## Prérequis

- Docker et Docker Compose
- PHP 8.2+, Composer et le [CLI Symfony](https://symfony.com/download)
- Node.js 20+ et npm

## Installation

```bash
# 1. Infrastructure (MySQL, phpMyAdmin, MailHog)
docker compose up -d

# 2. Backend
cd backend
composer install
php bin/console doctrine:migrations:migrate
symfony server:start            # http://localhost:8000

# 3. Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

Accès :

| Service        | URL                     |
|----------------|-------------------------|
| Frontend       | http://localhost:3000   |
| API backend    | http://localhost:8000   |
| phpMyAdmin     | http://localhost:8080   |
| MailHog (mails)| http://localhost:8025   |

## Fichiers d'environnement

Trois fichiers `.env`, aux rôles distincts :

- **`./.env`** — variables `MYSQL_*` et `DOCKER_MYSQL_PORT`, consommées uniquement par Docker Compose.
- **`backend/.env`** (+ `backend/.env.local` pour les secrets) — `DATABASE_URL`, `JWT_SECRET`,
  `MAILER_DSN`, `MESSENGER_TRANSPORT_DSN`, `CORS_ALLOW_ORIGIN`, `MISTRAL_API_KEY`,
  `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- **`frontend/.env`** (+ `frontend/.env.local`) — `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

> Si vous exécutez PHP sur l'hôte (et non dans un conteneur), utilisez la ligne
> `DATABASE_URL` pointant vers `127.0.0.1` dans `backend/.env`.

## Tâches de fond (workers)

Certaines fonctionnalités s'appuient sur le composant Scheduler de Symfony :

```bash
# Envoi asynchrone des emails (file d'attente en base, tick toutes les minutes)
php bin/console messenger:consume scheduler_mail

# Archivage automatique des articles (rétention 30 jours, tick quotidien)
php bin/console messenger:consume scheduler_article
```

Les mêmes traitements peuvent être déclenchés manuellement :

```bash
php bin/console app:mail:process          # traite un lot d'emails en attente
php bin/console app:articles:archive      # archive les articles publiés hors rétention
```

## Déploiement (stack conteneurisée)

Le `docker-compose.yml` ne sert qu'à l'infrastructure de développement (les deux
applications tournent sur l'hôte). Pour une exécution entièrement conteneurisée
(backend + frontend + base), utilisez le fichier de production :

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Fonctionnalités principales

- **Authentification** : email/mot de passe, Google Sign-In, et connexion sans mot
  de passe (magic link envoyé par email).
- **Génération IA (Mistral)** : idées de sujets, rédaction d'articles (fourchette
  de mots, ton, audience), repasse d'un paragraphe sélectionné.
- **SEO** : analyse serveur multi-critères pondérée, score persisté sur l'article.
- **Notion** : export d'articles, et planification de publication vers Google
  Calendar **ou** Notion.
- **Gestion de contenu** : historique des publications, export PDF / Markdown,
  cycle de vie (archivage léger après 30 jours).
- **Entreprise** : regroupement d'utilisateurs dans une organisation gérée par un propriétaire.
- **Administration** : panel admin (statistiques, utilisateurs, bannissement d'IP).
- **Multilingue** : interface français / anglais.

## Structure du dépôt

```
.
├── backend/      API Symfony (src/Controller/Api, src/Entity, src/Service, migrations)
├── frontend/     Client Next.js (src/app, src/components, src/locales)
├── docker-compose.yml        infra de développement
└── docker-compose.prod.yml   stack de production
```
