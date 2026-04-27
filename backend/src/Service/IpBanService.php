<?php

namespace App\Service;

use App\Entity\BannedIp;
use App\Repository\BannedIpRepository;
use Symfony\Component\HttpFoundation\Request;

class IpBanService
{
    public function __construct(
        private BannedIpRepository $bannedIpRepository
    ) {}

    /**
     * Récupère l'adresse IP réelle du client
     */
    public function getClientIp(Request $request): string
    {
        if ($request->headers->has('X-Forwarded-For')) {
            $ips = explode(',', $request->headers->get('X-Forwarded-For'));
            return trim($ips[0]);
        }

        if ($request->headers->has('X-Real-IP')) {
            return $request->headers->get('X-Real-IP');
        }

        return $request->getClientIp() ?? 'unknown';
    }

    /**
     * Vérifie si l'IP du client est bannie
     */
    public function isClientBanned(Request $request): bool
    {
        $clientIp = $this->getClientIp($request);
        return $this->bannedIpRepository->isIpBanned($clientIp);
    }

    /**
     * Récupère les informations du ban si l'IP est bannie
     */
    public function getBanInfo(Request $request): ?BannedIp
    {
        $clientIp = $this->getClientIp($request);
        return $this->bannedIpRepository->findActiveBannedIp($clientIp);
    }
}

