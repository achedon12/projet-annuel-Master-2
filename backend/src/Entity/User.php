<?php

namespace App\Entity;

final class User
{
    public function __construct(
        private int $id,
        private string $avatar,
        private string $bio,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
        private ?\DateTimeImmutable $loginAt,
        private string $name,
        private string $email,
        private string $password,
        private string $language,
        private string $theme,
    ) {
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getAvatar(): string
    {
        return $this->avatar;
    }

    public function setAvatar(string $avatar): void
    {
        $this->avatar = $avatar;
    }

    public function getBio(): string
    {
        return $this->bio;
    }

    public function setBio(string $bio): void
    {
        $this->bio = $bio;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function getLoginAt(): ?\DateTimeImmutable
    {
        return $this->loginAt;
    }

    public function setLoginAt(?\DateTimeImmutable $loginAt): void
    {
        $this->loginAt = $loginAt;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function getLanguage(): string
    {
        return $this->language;
    }

    public function setLanguage(string $language): void
    {
        $this->language = $language;
    }

    public function getTheme(): string
    {
        return $this->theme;
    }

    public function setTheme(string $theme): void
    {
        $this->theme = $theme;
    }
}
