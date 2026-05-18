<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Integration;
use App\Repository\ArticleRepository;
use App\Repository\IntegrationRepository;
use App\Service\JwtAuthService;
use App\Service\NotionService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/integrations/notion')]
class NotionIntegrationController extends ApiAbstractController
{
    private const TYPE = 'notion';
    private const TOKEN_MIN = 10;
    private const TOKEN_MAX = 500;
    private const PAGE_ID_MAX = 500;

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly IntegrationRepository $integrationRepository,
        private readonly ArticleRepository $articleRepository,
        private readonly NotionService $notion,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Retourne l'état de connexion Notion du user, sans jamais exposer le token.
     */
    #[Route('', name: 'api_integrations_notion_read', methods: ['GET'])]
    public function read(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $integration = $this->integrationRepository->findOneByUserAndType($user, self::TYPE);

        return $this->json([
            'connected' => $integration !== null && $integration->isActive(),
            'parentPageId' => $integration?->getUrl(),
            'lastSync' => $integration?->getLastSync()?->format('c'),
        ]);
    }

    /**
     * Connecte (ou met à jour) l'intégration Notion du user après validation du token.
     */
    #[Route('', name: 'api_integrations_notion_upsert', methods: ['PUT'])]
    public function upsert(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $apiKey = is_string($data['apiKey'] ?? null) ? trim($data['apiKey']) : '';
        $parentPageId = is_string($data['parentPageId'] ?? null) ? trim($data['parentPageId']) : '';

        if ($apiKey === '' || mb_strlen($apiKey) < self::TOKEN_MIN || mb_strlen($apiKey) > self::TOKEN_MAX) {
            return $this->json(['error' => 'Token Notion invalide ou manquant.'], Response::HTTP_BAD_REQUEST);
        }
        if ($parentPageId === '' || mb_strlen($parentPageId) > self::PAGE_ID_MAX) {
            return $this->json(['error' => 'Identifiant de page parente Notion invalide ou manquant.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$this->notion->validateToken($apiKey)) {
            return $this->json(['error' => 'Token Notion refusé par l\'API. Vérifie qu\'il est correct et que l\'intégration est active.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $integration = $this->integrationRepository->findOneByUserAndType($user, self::TYPE);
            if ($integration === null) {
                $integration = new Integration();
                $integration->setUser($user);
                $integration->setType(self::TYPE);
                $this->em->persist($integration);
            }
            $integration->setApiKey($apiKey);
            $integration->setUrl($parentPageId);
            $integration->setActive(true);
            $this->em->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Échec de persistance de l\'intégration Notion.', [
                'userId' => $user->getId(),
                'exception' => $e->getMessage(),
            ]);
            return $this->json(['error' => 'Impossible d\'enregistrer la connexion Notion.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'connected' => true,
            'parentPageId' => $integration->getUrl(),
            'lastSync' => $integration->getLastSync()?->format('c'),
        ]);
    }

    /**
     * Déconnecte l'intégration Notion : supprime l'Integration et nettoie
     * les notion_page_id des articles du user (pointaient vers cet espace).
     */
    #[Route('', name: 'api_integrations_notion_disconnect', methods: ['DELETE'])]
    public function disconnect(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $integration = $this->integrationRepository->findOneByUserAndType($user, self::TYPE);
        if ($integration === null) {
            return $this->json(null, Response::HTTP_NO_CONTENT);
        }

        try {
            $this->articleRepository->createQueryBuilder('a')
                ->update()
                ->set('a.notionPageId', ':null')
                ->where('a.user = :user')
                ->andWhere('a.notionPageId IS NOT NULL')
                ->setParameter('null', null)
                ->setParameter('user', $user)
                ->getQuery()
                ->execute();

            $this->em->remove($integration);
            $this->em->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Échec de déconnexion de l\'intégration Notion.', [
                'userId' => $user->getId(),
                'exception' => $e->getMessage(),
            ]);
            return $this->json(['error' => 'Impossible de déconnecter Notion.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
