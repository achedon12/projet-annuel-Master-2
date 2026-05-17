---
name: symfony-api-route
description: Use when the user asks to add or modify a backend HTTP endpoint under `backend/src/Controller/Api/`. Covers the opt-in JWT auth pattern via `JwtAuthService::authenticate()`, JSON response shape, the centralized `IpBanService::getClientIp()` helper, idiomatic HTTP status codes, and the conventional structure inheriting from `ApiAbstractController`.
---

# Ajouter une route API Symfony

## Pas de firewall — auth opt-in

Il n'y a **pas** de Symfony Security firewall configuré. L'authentification se fait par controller, en injectant `App\Service\JwtAuthService` et en appelant `authenticate($request)`.

## Squelette standard (route protégée user-scoped)

```php
<?php
namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Repository\MyThingRepository;
use App\Service\JwtAuthService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/my-things')]
class MyThingController extends ApiAbstractController
{
    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly MyThingRepository $repository,
    ) {}

    #[Route('', name: 'api_my_things_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        // Ownership : toujours filtrer par user
        $items = $this->repository->findBy(['user' => $user], ['createdAt' => 'DESC']);

        return $this->json([
            'items' => array_map(fn($item) => $this->serialize($item), $items),
        ]);
    }

    private function serialize($item): array
    {
        return [
            'id' => $item->getId(),
            // …
        ];
    }
}
```

## Référence

- `backend/src/Controller/Api/UserIpController.php` — pattern complet (auth check, query repo, serialize).
- `backend/src/Controller/Api/AuthController.php` — exemple sans auth (endpoint public).

## Conventions

### Ownership

Toute route qui retourne ou modifie une ressource user-scoped **doit** filtrer par `user`. Pas de `$repository->find($id)` puis check d'ownership : utiliser directement `findOneBy(['id' => $id, 'user' => $user])` ou un join via le QueryBuilder.

Sinon : un user A peut accéder/modifier les ressources du user B (IDOR).

### Récupérer l'IP client

**Jamais** `$request->getClientIp()` directement. Toujours via `App\Service\IpBanService::getClientIp($request)` — gère `X-Forwarded-For`, `X-Real-IP`, et le fallback.

### Format de réponse

- Succès lecture : `{ items: [...] }` ou directement l'objet sérialisé.
- Mutation : `{ message: '...', <ressource créée|modifiée> }`.
- Erreur : `{ error: 'Message en français' }` avec le bon status code.

### Codes HTTP

| Code | Quand |
|---|---|
| 200 | Succès lecture / update |
| 201 | Création réussie (POST) |
| 400 | Body invalide ou pré-condition manquante |
| 401 | Pas de JWT valide (renvoyé manuellement après `authenticate()` qui retourne null) |
| 403 | IP bannie (géré globalement par `IpBanCheckListener`) ou ressource publique interdite |
| 404 | Ressource introuvable ou pas owned par l'user |
| 409 | Conflit (déjà existe, état incompatible) |
| 422 | Validation Symfony (`ValidatorInterface->validate()`) — voir `AuthController::signup` |
| 500 | Erreur serveur |

### Body parsing

Avec `Request` :

```php
$data = json_decode($request->getContent(), true);
if (!is_array($data) || !isset($data['name'])) {
    return $this->json(['error' => 'Données invalides.'], Response::HTTP_BAD_REQUEST);
}
```

Pas de helper Zod-équivalent dans ce repo — utiliser `Symfony\Component\Validator\Validator\ValidatorInterface` si tu attaches des contraintes à une entité (voir `AuthController::signup`).

## Gotchas

- **`requireUser` / `requireApiUser`** n'existent pas dans ce projet — c'est `JwtAuthService::authenticate()` partout. Ne pas confondre avec le pattern du frontend (qui parle de `useSession()` côté Next).
- **`ApiAbstractController`** est vide actuellement, mais on en hérite quand même : c'est le point d'extension futur pour wrapping commun. Toujours étendre `ApiAbstractController`, pas directement `AbstractController`.
- **CORS** est géré par `nelmio/cors-bundle` configuré via `CORS_ALLOW_ORIGIN` dans `.env`. Le frontend (`http://localhost:3000`) est autorisé par défaut via la regex.
- **Le préfixe `/api`** sur la classe (`#[Route('/api/my-things')]`) est obligatoire pour que `IpBanCheckListener` filtre la route (le listener court-circuite seulement les paths commençant par `/api/`).
