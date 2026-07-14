<?php

namespace App\Repository;

use App\Entity\LoginToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LoginToken>
 */
class LoginTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LoginToken::class);
    }

    public function findValid(string $token): ?LoginToken
    {
        $entity = $this->findOneBy(['token' => $token]);

        return $entity !== null && $entity->isValid() ? $entity : null;
    }
}
