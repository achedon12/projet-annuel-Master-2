---
name: i18n-string
description: Use when the user asks to add, rename, or remove a UI string in the frontend — anything rendered to the user. Covers the two locale files (`src/locales/fr.json` and `src/locales/en.json`) that must stay in lockstep, the custom `useTranslation()` hook (NOT next-intl despite the dep being installed), `{var}` interpolation, the language switcher in Settings, and the fallback chain.
---

# Ajouter / renommer / supprimer une chaîne UI

## Le système — pas next-intl

`next-intl` est dans `package.json` mais **non utilisé**. Le système réel :

- Catalogues : `frontend/src/locales/{fr,en}.json`.
- Provider : `frontend/src/context/LanguageContext.jsx` (persiste dans `localStorage` sous `locale`).
- Hook : `frontend/src/hooks/useI18n.js` → `useTranslation()` retourne `{ t, locale }`.
- Fallback : locale courant → `fr` → clé brute.

## Ajouter une chaîne

1. Choisir un namespace existant si possible :

   | Namespace | Pour |
   |---|---|
   | `brand` | Nom de l'app uniquement |
   | `common` | Boutons et labels universels (`save`, `cancel`, `delete`, `connect`, `loading`…) |
   | `form` | Labels & placeholders de formulaires |
   | `nav` | Sidebar + navigation publique |
   | `auth` | Page `/auth` + toasts auth |
   | `home` | Landing `/` (hero, features, benefits, testimonials, pricing, cta, footer) |
   | `dashboard` | `/dashboard` (stats, charts, articles récents, quick actions) |
   | `history` | `/history` (filtres, status/type, calendrier) |
   | `ideas` | `/ideas` (config, mock, difficultés, volumes) |
   | `editor` | `/editor` (tons, audiences, SEO panel, exports) |
   | `settings` | `/settings` (tabs, profile, integrations, notifications, preferences, security) |

2. Ajouter la clé **dans les deux fichiers** `fr.json` et `en.json`. Une clé absente dans un fichier provoque un fallback vers FR (ou vers la clé brute si absente partout).

3. Côté composant client :

   ```jsx
   "use client";
   import { useTranslation } from "@/hooks/useI18n";

   const MyComp = () => {
     const { t } = useTranslation();
     return <button>{t("common.save")}</button>;
   };
   ```

## Interpolation

Dans le JSON :

```json
{ "resultsCount": "{count} résultat(s)" }
```

Dans le code :

```jsx
t("history.resultsCount", { count: filtered.length });
```

Variables manquantes → la balise `{var}` est laissée telle quelle, c'est intentionnel pour débugger.

## Renommer une clé

1. Renommer dans `fr.json` ET `en.json`.
2. `grep -rn '"ancienne.clef"' frontend/src/` puis remplacer chaque occurrence (idem pour `t("ancienne.clef")`).
3. Tester visuellement la page (pas de typecheck, c'est du JS).

## Supprimer une clé

1. `grep -rn '"clef.a.supprimer"' frontend/src/` ET `grep -rn 't("clef.a.supprimer"' frontend/src/` — vérifier qu'elle n'est plus utilisée nulle part.
2. Retirer de `fr.json` ET `en.json`.

## Règle d'or

- **Jamais de FR/EN en dur dans le JSX** — toujours via `t(...)`.
- **Exception tolérée** : messages d'erreur dans les réponses JSON des routes API Symfony — ils sont en français côté backend, c'est un choix assumé. Si tu en ajoutes un, cohérence FR.
- **Le sélecteur de langue** est dans `frontend/src/app/settings/page.jsx` (onglet « Préférences ») et appelle `useLanguage().changeLocale(value)`. Pas besoin de redéploiement pour ajouter une troisième langue : ajouter `src/locales/<code>.json`, étendre l'allow-list dans `LanguageContext.jsx`, et ajouter un `<SelectItem>` dans Settings.

## Vérification rapide

```bash
# Diff des clés FR vs EN (les deux doivent être identiques)
diff <(jq -r 'paths | join(".")' frontend/src/locales/fr.json | sort) \
     <(jq -r 'paths | join(".")' frontend/src/locales/en.json | sort)
```
