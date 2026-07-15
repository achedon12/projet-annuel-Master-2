<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Route racine de l'API.
 *
 * Sans elle, un GET / sur le domaine de l'API remonte une
 * NotFoundHttpException dans les logs à chaque passage d'un moniteur
 * d'uptime ou d'un scanner. Sert aussi de point de santé simple.
 */
class HealthController extends ApiAbstractController
{
    #[Route('/', name: 'api_health', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json([
            'status' => 'ok',
            'api' => 'pjr',
            'timestamp' => time(),
        ]);
    }
}
