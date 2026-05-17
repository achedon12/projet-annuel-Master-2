---
name: next-protected-page
description: Use when the user asks to add a new authenticated page to the frontend (Next.js 16, App Router). Covers the matcher in `proxy.js` (which replaces `middleware.ts`), the `useSession()` + `session.backendToken` pattern to call the Symfony backend, dark mode pairings, and the fr/en lockstep for any string added.
---

# Ajouter une page protégée

## Le flux complet

1. Créer la page sous `frontend/src/app/<route>/page.jsx`.
2. Ajouter `/<route>/:path*` au `matcher` array dans `frontend/src/proxy.js`.
3. Si la page appelle l'API Symfony : utiliser `useSession()` + `session.backendToken`.
4. Ajouter toutes les chaînes UI dans **les deux** `frontend/src/locales/fr.json` et `frontend/src/locales/en.json`.
5. Utiliser les paires `bg-X dark:bg-Y` / `text-X dark:text-Y` dès le départ — pas de page light-only.

## 1. Squelette de page

```jsx
"use client";
import { useTranslation } from "@/hooks/useI18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

const MyPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl">{t("mypage.title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("mypage.subtitle")}</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("mypage.section.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>…</CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MyPage;
```

## 2. Inscription dans le matcher

Édite `frontend/src/proxy.js` :

```js
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/history/:path*",
        "/ideas/:path*",
        "/settings/:path*",
        "/editor/:path*",
        "/mypage/:path*",   // ← ajouter ici
    ],
};
```

Sans cette ligne, la page reste accessible **sans connexion** — `ClientLayout` n'enforce plus l'auth, c'est `proxy.js` qui le fait au niveau requête.

## 3. Appeler le backend Symfony

```jsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { API_URL, Urls } from "@/utils/Api";

const MyComponent = () => {
    const { data: session, status } = useSession();
    const [items, setItems] = useState([]);

    const fetchData = useCallback(async () => {
        if (!session?.backendToken) return;
        const res = await fetch(`${API_URL}${Urls.user.ips}`, {
            headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items || []);
    }, [session?.backendToken]);

    useEffect(() => {
        if (status === "authenticated") fetchData();
    }, [status, fetchData]);

    // …
};
```

**Référence implémentation** : `frontend/src/components/settings/SecurityIpList.jsx`.

Ajouter la nouvelle URL dans `frontend/src/utils/Api.js` :

```js
export const Urls = {
    auth: { … },
    user: { ips: '/user/ips' },
    myThings: { list: '/my-things' },   // ← ici
};
```

## 4. Traductions

Voir le skill `i18n-string`. En résumé : ajouter les clés dans **les deux fichiers** `fr.json` ET `en.json`.

Pour une nouvelle page, créer un namespace dédié :

```json
{
    "mypage": {
        "title": "…",
        "subtitle": "…",
        "section": { "title": "…" }
    }
}
```

## 5. Dark mode

- **Surfaces de page** : `bg-slate-50 dark:bg-slate-950` (page), `bg-white dark:bg-slate-900` (cards/panneaux).
- **Textes muted** : `text-slate-600 dark:text-slate-400`.
- **Bordures** : `border dark:border-slate-800`.
- **Icônes secondaires** : `text-slate-400 dark:text-slate-500`.

Les primitives UI (`<Card>`, `<Button>`, `<Badge>`, `<Input>`) utilisent déjà des tokens sémantiques (`bg-card`, `text-foreground`, `border` via `--border`) et s'adaptent automatiquement. Pas besoin de `dark:` dessus.

**Exception** : `Sidebar.jsx` et le mobile topbar de `LayoutWrapper.jsx` sont en `bg-slate-900` permanent, c'est intentionnel — ne pas ajouter de `dark:` variants là-bas.

## Pièges

- **Page créée mais oubliée du matcher** → accessible sans auth, faille majeure. Toujours vérifier `frontend/src/proxy.js` après création.
- **`useSession()` dans un Server Component** → ne marche pas, le hook est client-only. Soit `"use client"` sur la page, soit utiliser `getServerSession(authOptions)` côté serveur (mais alors pas d'accès au cookie côté requête statique).
- **Strings codées en dur** au lieu de `t(...)` → la page ne switchera pas FR/EN.
- **`bg-white` sans `dark:`** → en mode sombre tu te retrouves avec une carte blanche illisible. La review (`fullstack-code-reviewer`) le rejette.
- **`fetch` sans `session.backendToken`** → 401 du backend (`JwtAuthService::authenticate()` retourne null).
