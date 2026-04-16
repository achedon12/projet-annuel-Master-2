<?php

namespace App\Entity;

use App\Repository\ArticleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ArticleRepository::class)]
class Article
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'articles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\OneToOne(targetEntity: Idea::class, inversedBy: 'article')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Idea $idea = null;

    #[ORM\OneToOne(targetEntity: EditArticle::class, inversedBy: 'article')]
    #[ORM\JoinColumn(nullable: true)]
    private ?EditArticle $editArticle = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $content = null;

    #[ORM\Column(length: 160, nullable: true)]
    private ?string $meta = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $seoScore = null;

    #[ORM\Column(length: 10, options: ['default' => 'draft'])]
    private string $status = 'draft';

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getIdea(): ?Idea
    {
        return $this->idea;
    }

    public function setIdea(?Idea $idea): static
    {
        $this->idea = $idea;
        return $this;
    }

    public function getEditArticle(): ?EditArticle
    {
        return $this->editArticle;
    }

    public function setEditArticle(?EditArticle $editArticle): static
    {
        $this->editArticle = $editArticle;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getMeta(): ?string
    {
        return $this->meta;
    }

    public function setMeta(?string $meta): static
    {
        $this->meta = $meta;
        return $this;
    }

    public function getSeoScore(): ?int
    {
        return $this->seoScore;
    }

    public function setSeoScore(?int $seoScore): static
    {
        $this->seoScore = $seoScore;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, ['draft', 'pub', 'delete'])) {
            throw new \InvalidArgumentException("Invalid status value: $status");
        }
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}
