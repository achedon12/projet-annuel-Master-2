<?php

namespace App\Repository;

use App\Entity\Article;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Article>
 */
class ArticleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Article::class);
    }

    /**
     * Liste les articles d'un utilisateur, filtres optionnels status/type, triés du plus récent au plus ancien.
     *
     * @return array<int, Article>
     */
    public function findByUser(User $user, ?string $status = null, ?string $type = null): array
    {
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.user = :user')
            ->setParameter('user', $user)
            ->orderBy('a.updatedAt', 'DESC');

        if ($status !== null) {
            $qb->andWhere('a.status = :status')->setParameter('status', $status);
        }
        if ($type !== null) {
            $qb->andWhere('a.type = :type')->setParameter('type', $type);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Articles publiés, pas encore archivés, dont la publication est antérieure
     * au seuil de rétention : candidats à l'archivage léger.
     *
     * @return array<int, Article>
     */
    public function findToArchive(\DateTimeInterface $before, int $limit = 200): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.archivedAt IS NULL')
            ->andWhere('a.status = :published')
            ->andWhere('a.publishedAt IS NOT NULL')
            ->andWhere('a.publishedAt < :before')
            ->setParameter('published', Article::STATUS_PUBLISHED)
            ->setParameter('before', $before)
            ->orderBy('a.publishedAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
