<?php

namespace App\Repository;

use App\Entity\Article;

final class ArticleRepository
{
    private string $storagePath;

    public function __construct(string $projectDir)
    {
        $this->storagePath = $projectDir.'/var/data/articles.json';
    }

    /**
     * @return Article[]
     */
    public function findAll(): array
    {
        $rows = $this->readRows();
        usort($rows, static fn (array $a, array $b): int => $b['id'] <=> $a['id']);

        return array_map(static fn (array $row): Article => Article::fromArray($row), $rows);
    }

    public function find(int $id): ?Article
    {
        foreach ($this->readRows() as $row) {
            if ((int) $row['id'] === $id) {
                return Article::fromArray($row);
            }
        }

        return null;
    }

    public function create(array $payload): Article
    {
        $rows = $this->readRows();
        $nextId = $this->nextId($rows);
        $article = Article::create($nextId, $payload);
        $rows[] = $article->toArray();

        $this->writeRows($rows);

        return $article;
    }

    public function update(Article $article): Article
    {
        $rows = $this->readRows();

        foreach ($rows as $index => $row) {
            if ((int) $row['id'] === $article->toArray()['id']) {
                $rows[$index] = $article->toArray();
                $this->writeRows($rows);

                return $article;
            }
        }

        $rows[] = $article->toArray();
        $this->writeRows($rows);

        return $article;
    }

    public function delete(int $id): bool
    {
        $rows = $this->readRows();
        $filtered = array_values(array_filter(
            $rows,
            static fn (array $row): bool => (int) $row['id'] !== $id
        ));

        if (count($filtered) === count($rows)) {
            return false;
        }

        $this->writeRows($filtered);

        return true;
    }

    public function getStats(): array
    {
        $articles = $this->findAll();
        $published = 0;
        $draft = 0;
        $totalWords = 0;
        $seoScores = [];

        foreach ($articles as $article) {
            $data = $article->toArray();
            $totalWords += (int) $data['word_count'];

            if ($data['status'] === 'published') {
                ++$published;
            } else {
                ++$draft;
            }

            if ($data['seo_score'] !== null) {
                $seoScores[] = (int) $data['seo_score'];
            }
        }

        return [
            'total_articles' => count($articles),
            'published_articles' => $published,
            'draft_articles' => $draft,
            'total_words' => $totalWords,
            'average_seo_score' => $seoScores === [] ? null : (int) round(array_sum($seoScores) / count($seoScores)),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readRows(): array
    {
        if (!is_file($this->storagePath)) {
            $this->initializeStorage();
        }

        $content = file_get_contents($this->storagePath);
        if ($content === false || trim($content) === '') {
            return [];
        }

        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     */
    private function writeRows(array $rows): void
    {
        $directory = dirname($this->storagePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        file_put_contents(
            $this->storagePath,
            json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
    }

    private function initializeStorage(): void
    {
        $seed = [
            [
                'id' => 1,
                'title' => 'Guide complet du SEO technique en 2026',
                'content' => "Un premier article de démonstration pour brancher rapidement le frontend sur une API réelle.",
                'status' => 'published',
                'tone' => 'professional',
                'audience' => 'intermediate',
                'seo_score' => 92,
                'word_count' => 14,
                'created_at' => '2026-03-05T10:00:00+00:00',
                'updated_at' => '2026-03-05T10:00:00+00:00',
                'published_at' => '2026-03-05T10:00:00+00:00',
            ],
            [
                'id' => 2,
                'title' => '10 stratégies de content marketing',
                'content' => "Un brouillon prêt à être enrichi depuis l'éditeur de contenu.",
                'status' => 'draft',
                'tone' => 'friendly',
                'audience' => 'general',
                'seo_score' => 85,
                'word_count' => 11,
                'created_at' => '2026-03-04T10:00:00+00:00',
                'updated_at' => '2026-03-04T10:00:00+00:00',
                'published_at' => null,
            ],
        ];

        $this->writeRows($seed);
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     */
    private function nextId(array $rows): int
    {
        $maxId = 0;
        foreach ($rows as $row) {
            $maxId = max($maxId, (int) ($row['id'] ?? 0));
        }

        return $maxId + 1;
    }
}
