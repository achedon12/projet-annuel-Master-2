<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Article;
use App\Entity\BannedIp;
use App\Entity\Idea;
use App\Entity\PendingMail;
use App\Entity\User;
use App\Entity\UserLoginIp;
use App\Repository\ArticleRepository;
use App\Repository\BannedIpRepository;
use App\Repository\IdeaRepository;
use App\Repository\PendingMailRepository;
use App\Repository\UserLoginIpRepository;
use App\Repository\UserRepository;
use App\Service\JwtAuthService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin')]
class AdminController extends ApiAbstractController
{
    private const STATS_WINDOW_DAYS = 30;
    private const USERS_DEFAULT_PER_PAGE = 20;
    private const USERS_MAX_PER_PAGE = 100;
    private const SEARCH_MAX = 100;
    private const IP_ADDRESS_MAX = 45;
    private const REASON_MAX = 500;

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly UserRepository $userRepository,
        private readonly ArticleRepository $articleRepository,
        private readonly IdeaRepository $ideaRepository,
        private readonly PendingMailRepository $pendingMailRepository,
        private readonly UserLoginIpRepository $userLoginIpRepository,
        private readonly BannedIpRepository $bannedIpRepository,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/stats', name: 'api_admin_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        try {
            $now = new \DateTimeImmutable();
            $since = $now->modify('-' . (self::STATS_WINDOW_DAYS - 1) . ' days')->setTime(0, 0);

            $articlesByStatus = $this->groupCount(
                $this->em->createQuery('SELECT a.status AS k, COUNT(a.id) AS c FROM ' . Article::class . ' a GROUP BY a.status')->getArrayResult(),
            );
            $mailsByStatus = $this->groupCount(
                $this->em->createQuery('SELECT m.status AS k, COUNT(m.id) AS c FROM ' . PendingMail::class . ' m GROUP BY m.status')->getArrayResult(),
            );

            $totals = [
                'users' => (int) $this->em->createQuery('SELECT COUNT(u.id) FROM ' . User::class . ' u')->getSingleScalarResult(),
                'articles' => array_sum($articlesByStatus),
                'ideas' => (int) $this->em->createQuery('SELECT COUNT(i.id) FROM ' . Idea::class . ' i')->getSingleScalarResult(),
                'mails' => array_sum($mailsByStatus),
                'bannedIps' => (int) $this->em->createQuery('SELECT COUNT(b.id) FROM ' . BannedIp::class . ' b')->getSingleScalarResult(),
                'loginEvents' => (int) $this->em->createQuery('SELECT COUNT(l.id) FROM ' . UserLoginIp::class . ' l')->getSingleScalarResult(),
            ];

            $series = [
                'signups' => $this->bucketByDay(
                    $this->em->createQuery('SELECT u.createdAt FROM ' . User::class . ' u WHERE u.createdAt >= :since')
                        ->setParameter('since', $since)
                        ->getArrayResult(),
                    'createdAt',
                    $since,
                    $now,
                ),
                'articles' => $this->bucketByDay(
                    $this->em->createQuery('SELECT a.createdAt FROM ' . Article::class . ' a WHERE a.createdAt >= :since')
                        ->setParameter('since', $since)
                        ->getArrayResult(),
                    'createdAt',
                    $since,
                    $now,
                ),
                'ideas' => $this->bucketByDay(
                    $this->em->createQuery('SELECT i.date FROM ' . Idea::class . ' i WHERE i.date >= :since')
                        ->setParameter('since', $since)
                        ->getArrayResult(),
                    'date',
                    $since,
                    $now,
                ),
                'mails' => $this->bucketByDay(
                    $this->em->createQuery('SELECT m.createdAt, m.status FROM ' . PendingMail::class . ' m WHERE m.createdAt >= :since')
                        ->setParameter('since', $since)
                        ->getArrayResult(),
                    'createdAt',
                    $since,
                    $now,
                    'status',
                ),
            ];

            $topAuthors = $this->em->createQuery(
                'SELECT u.id AS userId, u.name, u.email, COUNT(a.id) AS articleCount '
                . 'FROM ' . User::class . ' u LEFT JOIN ' . Article::class . ' a WITH a.user = u '
                . 'GROUP BY u.id ORDER BY articleCount DESC'
            )->setMaxResults(5)->getArrayResult();

            return $this->json([
                'totals' => $totals,
                'articlesByStatus' => $articlesByStatus,
                'mailsByStatus' => $mailsByStatus,
                'series' => $series,
                'topAuthors' => array_map(
                    fn(array $row) => [
                        'id' => (int) $row['userId'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'articleCount' => (int) $row['articleCount'],
                    ],
                    $topAuthors,
                ),
                'windowDays' => self::STATS_WINDOW_DAYS,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur lors du calcul des stats admin.', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Erreur interne lors du calcul des statistiques.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/users', name: 'api_admin_users_list', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $perPage = (int) $request->query->get('perPage', self::USERS_DEFAULT_PER_PAGE);
        $perPage = max(1, min(self::USERS_MAX_PER_PAGE, $perPage));
        $search = (string) $request->query->get('search', '');
        $search = mb_substr(trim($search), 0, self::SEARCH_MAX);

        $qb = $this->userRepository->createQueryBuilder('u')->orderBy('u.createdAt', 'DESC');
        if ($search !== '') {
            $qb->andWhere('u.email LIKE :search OR u.name LIKE :search')
                ->setParameter('search', '%' . $search . '%');
        }

        $countQb = clone $qb;
        $total = (int) $countQb->select('COUNT(u.id)')->getQuery()->getSingleScalarResult();

        $items = $qb->setFirstResult(($page - 1) * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return $this->json([
            'items' => array_map(fn(User $u) => $this->serializeUserListItem($u), $items),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
        ]);
    }

    #[Route('/users/{id}', name: 'api_admin_users_read', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function readUser(int $id, Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serializeUserDetail($user));
    }

    #[Route('/users/{id}', name: 'api_admin_users_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteUser(int $id, Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        if ($id === $admin->getId()) {
            return $this->json(['error' => 'Vous ne pouvez pas vous supprimer vous-même.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/banned-ips', name: 'api_admin_banned_ips_list', methods: ['GET'])]
    public function listBannedIps(Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $items = $this->bannedIpRepository->createQueryBuilder('b')
            ->orderBy('b.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json([
            'items' => array_map(fn(BannedIp $b) => $this->serializeBannedIp($b), $items),
        ]);
    }

    #[Route('/banned-ips', name: 'api_admin_banned_ips_create', methods: ['POST'])]
    public function createBannedIp(Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $ipAddress = isset($data['ipAddress']) && is_string($data['ipAddress']) ? trim($data['ipAddress']) : '';
        if ($ipAddress === '' || !filter_var($ipAddress, FILTER_VALIDATE_IP)) {
            return $this->json(['error' => 'Adresse IP invalide.'], Response::HTTP_BAD_REQUEST);
        }
        if (mb_strlen($ipAddress) > self::IP_ADDRESS_MAX) {
            return $this->json(['error' => 'Adresse IP trop longue.'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->bannedIpRepository->findOneBy(['ipAddress' => $ipAddress])) {
            return $this->json(['error' => 'Cette adresse IP est déjà bannie.'], Response::HTTP_CONFLICT);
        }

        $reason = null;
        if (isset($data['reason']) && is_string($data['reason']) && trim($data['reason']) !== '') {
            $reason = trim($data['reason']);
            if (mb_strlen($reason) > self::REASON_MAX) {
                return $this->json(['error' => 'Raison trop longue (max ' . self::REASON_MAX . ' caractères).'], Response::HTTP_BAD_REQUEST);
            }
        }

        $isPermanent = isset($data['isPermanent']) ? (bool) $data['isPermanent'] : false;

        $bannedUntil = null;
        if (!$isPermanent && isset($data['bannedUntil']) && is_string($data['bannedUntil']) && $data['bannedUntil'] !== '') {
            try {
                $bannedUntil = new \DateTime($data['bannedUntil']);
            } catch (\Throwable) {
                return $this->json(['error' => 'Date de fin invalide (ISO 8601 attendu).'], Response::HTTP_BAD_REQUEST);
            }
            if ($bannedUntil <= new \DateTime()) {
                return $this->json(['error' => 'La date de fin doit être dans le futur.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $ban = new BannedIp();
        $ban->setIpAddress($ipAddress);
        $ban->setReason($reason);
        $ban->setIsPermanent($isPermanent);
        $ban->setBannedUntil($bannedUntil);

        $this->em->persist($ban);
        $this->em->flush();

        return $this->json($this->serializeBannedIp($ban), Response::HTTP_CREATED);
    }

    #[Route('/banned-ips/{id}', name: 'api_admin_banned_ips_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteBannedIp(int $id, Request $request): JsonResponse
    {
        $admin = $this->resolveAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $ban = $this->bannedIpRepository->find($id);
        if (!$ban) {
            return $this->json(['error' => 'Bannissement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($ban);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Authentifie l'admin ou renvoie 401 (pas de token) / 403 (token mais pas admin).
     */
    private function resolveAdmin(Request $request): User|JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if (!$user->isAdmin()) {
            return $this->json(['error' => 'Accès réservé aux administrateurs.'], Response::HTTP_FORBIDDEN);
        }
        return $user;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);
        return is_array($data) ? $data : null;
    }

    /**
     * Convertit un tableau de tuples {k, c} en map clé → count int.
     *
     * @param array<int, array{k:string|null, c:int|string}> $rows
     * @return array<string, int>
     */
    private function groupCount(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $key = $row['k'] ?? 'unknown';
            $out[$key] = (int) $row['c'];
        }
        return $out;
    }

    /**
     * Agrège une liste de rows par jour (clé YYYY-MM-DD), avec optionnellement
     * un breakdown par valeur d'un champ secondaire (ex: status pour les mails).
     *
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array{date:string, count?:int}|array<string, mixed>>
     */
    private function bucketByDay(
        array $rows,
        string $dateField,
        \DateTimeImmutable $since,
        \DateTimeImmutable $until,
        ?string $breakdownField = null,
    ): array {
        $buckets = [];
        for ($d = $since; $d <= $until; $d = $d->modify('+1 day')) {
            $key = $d->format('Y-m-d');
            $buckets[$key] = ['date' => $key, 'count' => 0];
        }

        foreach ($rows as $row) {
            $date = $row[$dateField] ?? null;
            if (!$date instanceof \DateTimeInterface) {
                continue;
            }
            $key = $date->format('Y-m-d');
            if (!isset($buckets[$key])) {
                continue;
            }
            $buckets[$key]['count']++;
            if ($breakdownField !== null) {
                $breakdownValue = $row[$breakdownField] ?? 'unknown';
                $buckets[$key][$breakdownValue] = ($buckets[$key][$breakdownValue] ?? 0) + 1;
            }
        }

        return array_values($buckets);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUserListItem(User $user): array
    {
        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'avatar' => $user->getAvatar(),
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'lastLogin' => $user->getLastLogin()?->format('c'),
            'articleCount' => $user->getArticles()->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUserDetail(User $user): array
    {
        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatar(),
            'bio' => $user->getBio(),
            'language' => $user->getLanguage(),
            'theme' => $user->getTheme(),
            'role' => $user->getRole(),
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'updatedAt' => $user->getUpdatedAt()?->format('c'),
            'lastLogin' => $user->getLastLogin()?->format('c'),
            'articleCount' => $user->getArticles()->count(),
            'ideaCount' => $user->getIdeas()->count(),
            'loginIpCount' => $user->getLoginIps()->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBannedIp(BannedIp $ban): array
    {
        return [
            'id' => $ban->getId(),
            'ipAddress' => $ban->getIpAddress(),
            'reason' => $ban->getReason(),
            'isPermanent' => $ban->isPermanent(),
            'bannedUntil' => $ban->getBannedUntil()?->format('c'),
            'createdAt' => $ban->getCreatedAt()?->format('c'),
            'active' => $ban->isActive(),
        ];
    }
}
