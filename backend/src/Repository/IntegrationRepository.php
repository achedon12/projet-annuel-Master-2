<?php

namespace App\Repository;

use App\Entity\Integration;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Integration>
 */
class IntegrationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Integration::class);
    }

    /**
     * Retourne l'intégration (user, type) ou null. Centralise le filtre ownership.
     */
    public function findOneByUserAndType(User $user, string $type): ?Integration
    {
        return $this->findOneBy(['user' => $user, 'type' => $type]);
    }
}
