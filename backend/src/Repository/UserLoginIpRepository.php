<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserLoginIp;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserLoginIp>
 */
class UserLoginIpRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserLoginIp::class);
    }

    public function findOneByUserAndIp(User $user, string $ipAddress): ?UserLoginIp
    {
        return $this->findOneBy([
            'user' => $user,
            'ipAddress' => $ipAddress,
        ]);
    }

    /**
     * Retourne l'historique IP d'un utilisateur, du plus récent au plus ancien.
     *
     * @return UserLoginIp[]
     */
    public function findByUser(User $user, int $limit = 50): array
    {
        return $this->createQueryBuilder('uli')
            ->where('uli.user = :user')
            ->setParameter('user', $user)
            ->orderBy('uli.lastSeenAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
