<?php

namespace App\Repository;

use App\Entity\PendingMail;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PendingMail>
 */
class PendingMailRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PendingMail::class);
    }

    /**
     * Récupère un lot de mails à envoyer, du plus ancien au plus récent.
     *
     * @return PendingMail[]
     */
    public function findPendingBatch(int $limit = 50): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.status = :pending')
            ->setParameter('pending', PendingMail::STATUS_PENDING)
            ->orderBy('m.createdAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
