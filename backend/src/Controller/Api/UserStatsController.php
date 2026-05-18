<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Article;
use App\Entity\User;
use App\Service\JwtAuthService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/user')]
class UserStatsController extends ApiAbstractController
{
    private const WINDOW_DAYS = 7;
    private const RECENT_LIMIT = 5;

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Statistiques agrégées sur les articles du user authentifié pour le dashboard.
     * Toutes les valeurs sont scopées strictement au JWT — pas d'accès cross-user.
     */
    #[Route('/stats', name: 'api_user_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            return $this->json([
                'totals' => $this->computeTotals($user),
                'series' => $this->computeSeries($user),
                'recentArticles' => $this->computeRecentArticles($user),
                'windowDays' => self::WINDOW_DAYS,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur lors du calcul des stats utilisateur.', [
                'userId' => $user->getId(),
                'exception' => $e->getMessage(),
            ]);
            return $this->json(['error' => 'Erreur interne lors du calcul des statistiques.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @return array{articles:int, wordsTotal:int, seoAverage:?int, lastActivity:?string}
     */
    private function computeTotals(User $user): array
    {
        $row = $this->em->createQuery(
            'SELECT COUNT(a.id) AS total, '
            . 'COALESCE(SUM(a.wordCount), 0) AS words, '
            . 'AVG(a.seoScore) AS seoAvg, '
            . 'MAX(a.updatedAt) AS lastActivity '
            . 'FROM ' . Article::class . ' a WHERE a.user = :user'
        )
            ->setParameter('user', $user)
            ->getOneOrNullResult();

        $articles = (int) ($row['total'] ?? 0);
        $wordsTotal = (int) ($row['words'] ?? 0);
        $seoAvg = $row['seoAvg'] ?? null;
        $seoAverage = $seoAvg === null ? null : (int) round((float) $seoAvg);

        $lastActivityRaw = $row['lastActivity'] ?? null;
        $lastActivity = null;
        if ($lastActivityRaw instanceof \DateTimeInterface) {
            $lastActivity = $lastActivityRaw->format('c');
        } elseif (is_string($lastActivityRaw) && $lastActivityRaw !== '') {
            try {
                $lastActivity = (new \DateTime($lastActivityRaw))->format('c');
            } catch (\Throwable $e) {
                $this->logger->warning('Parsing de lastActivity en échec.', [
                    'raw' => $lastActivityRaw,
                    'exception' => $e->getMessage(),
                ]);
                $lastActivity = null;
            }
        }

        return [
            'articles' => $articles,
            'wordsTotal' => $wordsTotal,
            'seoAverage' => $seoAverage,
            'lastActivity' => $lastActivity,
        ];
    }

    /**
     * Buckets par jour sur les WINDOW_DAYS derniers jours (today inclus).
     *
     * @return list<array{date:string, articles:int, words:int}>
     */
    private function computeSeries(User $user): array
    {
        $now = new \DateTimeImmutable();
        $since = $now->modify('-' . (self::WINDOW_DAYS - 1) . ' days')->setTime(0, 0);

        $rows = $this->em->createQuery(
            'SELECT a.createdAt AS createdAt, a.wordCount AS wordCount '
            . 'FROM ' . Article::class . ' a '
            . 'WHERE a.user = :user AND a.createdAt >= :since'
        )
            ->setParameter('user', $user)
            ->setParameter('since', $since)
            ->getArrayResult();

        $buckets = [];
        for ($d = $since; $d <= $now; $d = $d->modify('+1 day')) {
            $buckets[$d->format('Y-m-d')] = ['articles' => 0, 'words' => 0];
        }

        foreach ($rows as $row) {
            $date = $row['createdAt'] ?? null;
            if (!$date instanceof \DateTimeInterface) {
                continue;
            }
            $key = $date->format('Y-m-d');
            if (!isset($buckets[$key])) {
                continue;
            }
            $buckets[$key]['articles']++;
            $buckets[$key]['words'] += (int) ($row['wordCount'] ?? 0);
        }

        $series = [];
        foreach ($buckets as $date => $stat) {
            $series[] = [
                'date' => $date,
                'articles' => $stat['articles'],
                'words' => $stat['words'],
            ];
        }
        return $series;
    }

    /**
     * Cinq derniers articles du user, triés par mise à jour décroissante.
     *
     * @return list<array{id:int, title:string, status:string, seoScore:?int, updatedAt:?string}>
     */
    private function computeRecentArticles(User $user): array
    {
        $items = $this->em->createQuery(
            'SELECT a.id, a.title, a.status, a.seoScore, a.updatedAt '
            . 'FROM ' . Article::class . ' a '
            . 'WHERE a.user = :user ORDER BY a.updatedAt DESC'
        )
            ->setParameter('user', $user)
            ->setMaxResults(self::RECENT_LIMIT)
            ->getArrayResult();

        $out = [];
        foreach ($items as $row) {
            $updatedAt = $row['updatedAt'] ?? null;
            $out[] = [
                'id' => (int) $row['id'],
                'title' => (string) $row['title'],
                'status' => (string) $row['status'],
                'seoScore' => $row['seoScore'] !== null ? (int) $row['seoScore'] : null,
                'updatedAt' => $updatedAt instanceof \DateTimeInterface ? $updatedAt->format('c') : null,
            ];
        }
        return $out;
    }
}
