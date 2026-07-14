<?php

namespace App\Service;

use App\Entity\Article;
use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Cycle de vie des articles : l'historique complet est conservé pendant
 * RETENTION_DAYS jours après publication, puis on procède à un archivage
 * léger — le corps du texte est purgé, seuls la thématique (titre/type) et
 * les liens sont conservés. L'opération est idempotente.
 */
class ArticleLifecycleService
{
    public const RETENTION_DAYS = 30;

    public function __construct(
        private readonly ArticleRepository $repository,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Archive tous les articles dont la rétention est dépassée.
     *
     * @return int nombre d'articles archivés
     */
    public function archiveExpired(int $retentionDays = self::RETENTION_DAYS): int
    {
        $threshold = new \DateTimeImmutable('-' . max(1, $retentionDays) . ' days');
        $articles = $this->repository->findToArchive($threshold);

        $count = 0;
        foreach ($articles as $article) {
            $this->archive($article);
            ++$count;
        }

        if ($count > 0) {
            $this->em->flush();
            $this->logger->info('Archivage léger des articles (cycle de vie).', [
                'count' => $count,
                'retentionDays' => $retentionDays,
            ]);
        }

        return $count;
    }

    /**
     * Archive un article : purge le corps, conserve thématique + liens.
     */
    public function archive(Article $article): void
    {
        $links = $this->extractLinks((string) $article->getContent());
        $article->setContent($this->buildArchiveNote($links));
        $article->setStatus(Article::STATUS_ARCHIVED);
        $article->setArchivedAt(new \DateTime());
        $article->setWordCount(0);
        $article->setUpdatedAt(new \DateTime());
    }

    /**
     * @return array<int, string>
     */
    private function extractLinks(string $content): array
    {
        $links = [];
        if (preg_match_all('/\[[^\]]+\]\(([^)]+)\)/', $content, $m, PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $links[] = trim($match[1]);
            }
        }
        if (preg_match_all('#https?://[^\s)\]]+#', $content, $bare)) {
            foreach ($bare[0] as $url) {
                $links[] = trim($url);
            }
        }

        return array_values(array_unique(array_filter($links, static fn (string $l): bool => $l !== '')));
    }

    /**
     * @param array<int, string> $links
     */
    private function buildArchiveNote(array $links): string
    {
        $note = '> Article archivé le ' . (new \DateTime())->format('Y-m-d')
            . '. Corps du texte purgé (rétention ' . self::RETENTION_DAYS . ' jours).';

        if ($links === []) {
            return $note;
        }

        $note .= "\n\nLiens conservés :\n";
        foreach (array_slice($links, 0, 50) as $link) {
            $note .= '- ' . $link . "\n";
        }

        return rtrim($note);
    }
}
