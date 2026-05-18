<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Integration;
use App\Repository\ArticleRepository;
use App\Repository\IntegrationRepository;
use App\Service\GoogleCalendarService;
use App\Service\JwtAuthService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/integrations/google')]
class GoogleIntegrationController extends ApiAbstractController
{
    private const TYPE = 'google';

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly IntegrationRepository $integrationRepository,
        private readonly ArticleRepository $articleRepository,
        private readonly GoogleCalendarService $calendar,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Statut de la connexion Google du user, sans jamais exposer les tokens.
     */
    #[Route('', name: 'api_integrations_google_read', methods: ['GET'])]
    public function read(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $integration = $this->integrationRepository->findOneByUserAndType($user, self::TYPE);

        return $this->json([
            'connected' => $integration !== null && $integration->isActive(),
            'scopes' => $integration?->getScopes(),
            'lastSync' => $integration?->getLastSync()?->format('c'),
            'tokenExpiresAt' => $integration?->getTokenExpiresAt()?->format('c'),
        ]);
    }

    /**
     * Échange le code OAuth Google contre des tokens et persiste l'intégration.
     * Appelé par la page front /auth/google-calendar/callback.
     */
    #[Route('/calendar/connect', name: 'api_integrations_google_calendar_connect', methods: ['POST'])]
    public function connectCalendar(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $code = is_string($data['code'] ?? null) ? trim($data['code']) : '';
        $redirectUri = is_string($data['redirectUri'] ?? null) ? trim($data['redirectUri']) : '';

        if ($code === '' || mb_strlen($code) > 2000) {
            return $this->json(['error' => 'Code OAuth Google manquant ou invalide.'], Response::HTTP_BAD_REQUEST);
        }
        if ($redirectUri === '' || mb_strlen($redirectUri) > 500) {
            return $this->json(['error' => 'redirectUri manquant ou invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $tokens = $this->calendar->exchangeCode($code, $redirectUri);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_GATEWAY);
        }

        try {
            $integration = $this->integrationRepository->findOneByUserAndType($user, self::TYPE);
            if ($integration === null) {
                $integration = new Integration();
                $integration->setUser($user);
                $integration->setType(self::TYPE);
                $this->em->persist($integration);
            }

            $integration->setApiKey($tokens['access_token']);
            // Le refresh_token n'est renvoyé qu'à la première autorisation (ou si prompt=consent).
            // S'il manque, on garde l'ancien (cas re-connexion sans prompt=consent).
            if ($tokens['refresh_token'] !== null) {
                $integration->setRefreshToken($tokens['refresh_token']);
            }
            $integration->setTokenExpiresAt(
                (new \DateTime())->modify('+' . $tokens['expires_in'] . ' seconds')
            );
            $integration->setScopes($tokens['scope']);
            $integration->setActive(true);
            $this->em->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Échec de persistance de l\'intégration Google.', [
                'userId' => $user->getId(),
                'exception' => $e->getMessage(),
            ]);
            return $this->json(['error' => 'Impossible d\'enregistrer la connexion Google.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'connected' => true,
            'scopes' => $integration->getScopes(),
            'lastSync' => $integration->getLastSync()?->format('c'),
            'tokenExpiresAt' => $integration->getTokenExpiresAt()?->format('c'),
        ]);
    }

    /**
     * Déconnecte l'intégration Google : supprime l'Integration et nettoie
     * les google_event_id des articles du user.
     */
    #[Route('', name: 'api_integrations_google_disconnect', methods: ['DELETE'])]
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
                ->set('a.googleEventId', ':null')
                ->where('a.user = :user')
                ->andWhere('a.googleEventId IS NOT NULL')
                ->setParameter('null', null)
                ->setParameter('user', $user)
                ->getQuery()
                ->execute();

            $this->em->remove($integration);
            $this->em->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Échec de déconnexion Google.', [
                'userId' => $user->getId(),
                'exception' => $e->getMessage(),
            ]);
            return $this->json(['error' => 'Impossible de déconnecter Google.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
