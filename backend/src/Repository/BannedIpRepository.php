<?php

namespace App\Repository;

use App\Entity\BannedIp;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BannedIp>
 */
class BannedIpRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BannedIp::class);
    }

    /**
     * Vérifie si une adresse IP est bannie et active
     */
    public function isIpBanned(string $ipAddress): bool
    {
        $bannedIp = $this->findOneBy(['ipAddress' => $ipAddress]);

        if (!$bannedIp) {
            return false;
        }

        return $bannedIp->isActive();
    }

    /**
     * Récupère un BannedIp actif par adresse IP
     */
    public function findActiveBannedIp(string $ipAddress): ?BannedIp
    {
        $bannedIp = $this->findOneBy(['ipAddress' => $ipAddress]);

        if ($bannedIp && $bannedIp->isActive()) {
            return $bannedIp;
        }

        return null;
    }
}

