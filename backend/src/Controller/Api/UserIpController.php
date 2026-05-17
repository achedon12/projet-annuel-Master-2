<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\UserLoginIp;
use App\Repository\UserLoginIpRepository;
use App\Service\IpBanService;
use App\Service\JwtAuthService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/user')]
class UserIpController extends ApiAbstractController
{
    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly UserLoginIpRepository $repository,
        private readonly IpBanService $ipBanService,
    ) {}

    #[Route('/ips', name: 'api_user_ips_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $currentIp = $this->ipBanService->getClientIp($request);
        $records = $this->repository->findByUser($user, 100);

        return $this->json([
            'currentIp' => $currentIp,
            'items' => array_map(
                fn(UserLoginIp $r) => $this->serialize($r, $currentIp),
                $records,
            ),
        ]);
    }

    private function serialize(UserLoginIp $record, string $currentIp): array
    {
        return [
            'id' => $record->getId(),
            'ipAddress' => $record->getIpAddress(),
            'userAgent' => $record->getUserAgent(),
            'event' => $record->getEvent(),
            'createdAt' => $record->getCreatedAt()?->format('c'),
            'lastSeenAt' => $record->getLastSeenAt()?->format('c'),
            'isCurrent' => $record->getIpAddress() === $currentIp,
        ];
    }
}
