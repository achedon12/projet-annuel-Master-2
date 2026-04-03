<?php

namespace App\Entity;

final class Article
{
    public function __construct(
        private int $id,
        private string $title,
        private string $content,
        private string $status = 'draft',
        private ?string $tone = null,
        private ?string $audience = null,
        private ?int $seoScore = null,
        private ?int $wordCount = null,
        private \DateTimeImmutable $createdAt = new \DateTimeImmutable(),
        private \DateTimeImmutable $updatedAt = new \DateTimeImmutable(),
        private ?\DateTimeImmutable $publishedAt = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: (int) $data['id'],
            title: (string) $data['title'],
            content: (string) $data['content'],
            status: (string) ($data['status'] ?? 'draft'),
            tone: $data['tone'] ?? null,
            audience: $data['audience'] ?? null,
            seoScore: isset($data['seo_score']) ? (int) $data['seo_score'] : null,
            wordCount: isset($data['word_count']) ? (int) $data['word_count'] : null,
            createdAt: new \DateTimeImmutable((string) $data['created_at']),
            updatedAt: new \DateTimeImmutable((string) $data['updated_at']),
            publishedAt: isset($data['published_at']) && $data['published_at'] !== null
                ? new \DateTimeImmutable((string) $data['published_at'])
                : null,
        );
    }

    public function updateFromPayload(array $payload): void
    {
        $now = new \DateTimeImmutable();

        if (array_key_exists('title', $payload)) {
            $this->title = trim((string) $payload['title']);
        }

        if (array_key_exists('content', $payload)) {
            $this->content = trim((string) $payload['content']);
            $this->wordCount = self::computeWordCount($this->content);
        }

        if (array_key_exists('tone', $payload)) {
            $this->tone = $payload['tone'] !== null ? trim((string) $payload['tone']) : null;
        }

        if (array_key_exists('audience', $payload)) {
            $this->audience = $payload['audience'] !== null ? trim((string) $payload['audience']) : null;
        }

        if (array_key_exists('seo_score', $payload)) {
            $this->seoScore = $payload['seo_score'] !== null ? (int) $payload['seo_score'] : null;
        }

        if (array_key_exists('status', $payload)) {
            $this->status = trim((string) $payload['status']);
            $this->publishedAt = $this->status === 'published'
                ? ($this->publishedAt ?? $now)
                : null;
        }

        $this->updatedAt = $now;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status,
            'tone' => $this->tone,
            'audience' => $this->audience,
            'seo_score' => $this->seoScore,
            'word_count' => $this->wordCount ?? self::computeWordCount($this->content),
            'created_at' => $this->createdAt->format(\DateTimeInterface::ATOM),
            'updated_at' => $this->updatedAt->format(\DateTimeInterface::ATOM),
            'published_at' => $this->publishedAt?->format(\DateTimeInterface::ATOM),
        ];
    }

    public static function create(int $id, array $payload): self
    {
        $now = new \DateTimeImmutable();
        $status = trim((string) ($payload['status'] ?? 'draft'));

        return new self(
            id: $id,
            title: trim((string) $payload['title']),
            content: trim((string) $payload['content']),
            status: $status,
            tone: isset($payload['tone']) && $payload['tone'] !== null ? trim((string) $payload['tone']) : null,
            audience: isset($payload['audience']) && $payload['audience'] !== null ? trim((string) $payload['audience']) : null,
            seoScore: isset($payload['seo_score']) && $payload['seo_score'] !== null ? (int) $payload['seo_score'] : null,
            wordCount: self::computeWordCount((string) $payload['content']),
            createdAt: $now,
            updatedAt: $now,
            publishedAt: $status === 'published' ? $now : null,
        );
    }

    private static function computeWordCount(string $content): int
    {
        $trimmed = trim($content);

        if ($trimmed === '') {
            return 0;
        }

        return count(preg_split('/\s+/', $trimmed) ?: []);
    }
}
