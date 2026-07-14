<?php

namespace App\Repository;

use App\Entity\Invitation;
use App\Entity\Organization;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Invitation>
 */
class InvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invitation::class);
    }

    /**
     * Invitation valide (non acceptée, non expirée) pour un hash de jeton.
     */
    public function findValidByTokenHash(string $tokenHash): ?Invitation
    {
        $entity = $this->findOneBy(['tokenHash' => $tokenHash]);

        return $entity !== null && $entity->isPending() ? $entity : null;
    }

    /**
     * Invitation en attente pour un email dans une organisation donnée.
     */
    public function findPendingForEmail(Organization $organization, string $email): ?Invitation
    {
        $entity = $this->findOneBy([
            'organization' => $organization,
            'email' => $email,
            'acceptedAt' => null,
        ]);

        return $entity !== null && $entity->isPending() ? $entity : null;
    }

    /**
     * Invitations en attente d'une organisation, plus récentes d'abord.
     *
     * @return list<Invitation>
     */
    public function findPendingForOrganization(Organization $organization): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.organization = :org')
            ->andWhere('i.acceptedAt IS NULL')
            ->andWhere('i.expiresAt > :now')
            ->setParameter('org', $organization)
            ->setParameter('now', new \DateTime())
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
