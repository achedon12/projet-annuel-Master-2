<?php

namespace App\Entity;

final class EditArticle
{
    public function __construct(
        private int $id,
        private int $userId,
        private ?int $ideaId,
        private string $text,
        private string $begin,
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

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): void
    {
        $this->text = $text;
    }

    public function getBegin(): string
    {
        return $this->begin;
    }

    public function setBegin(string $begin): void
    {
        $this->begin = $begin;
    }
}
