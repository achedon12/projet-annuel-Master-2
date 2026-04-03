<?php

namespace App\Entity;

final class Article
{
    public function __construct(
        private int $id,
        private int $userId,
        private ?int $ideaId,
        private ?int $editArticleId,
        private string $content,
        private int $seo,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
        private string $title,
        private string $meta,
        private string $status,
    ) {
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function setUserId(int $userId): void
    {
        $this->userId = $userId;
    }

    public function getIdeaId(): ?int
    {
        return $this->ideaId;
    }

    public function setIdeaId(?int $ideaId): void
    {
        $this->ideaId = $ideaId;
    }

    public function getEditArticleId(): ?int
    {
        return $this->editArticleId;
    }

    public function setEditArticleId(?int $editArticleId): void
    {
        $this->editArticleId = $editArticleId;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): void
    {
        $this->content = $content;
    }

    public function getSeo(): int
    {
        return $this->seo;
    }

    public function setSeo(int $seo): void
    {
        $this->seo = $seo;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getMeta(): string
    {
        return $this->meta;
    }

    public function setMeta(string $meta): void
    {
        $this->meta = $meta;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }
}
