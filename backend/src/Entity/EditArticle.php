<?php

namespace App\Entity;

use App\Repository\EditArticleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EditArticleRepository::class)]
class EditArticle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'editArticles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\OneToOne(targetEntity: Idea::class, inversedBy: 'editArticle')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Idea $idea = null;

    #[ORM\Column(length: 255)]
    private ?string $tone = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $audience = null;

    #[ORM\Column(length: 160, nullable: true)]
    private ?string $beginning = null;

    #[ORM\OneToOne(targetEntity: Article::class, mappedBy: 'editArticle')]
    private ?Article $article = null;

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

    public function getTone(): ?string
    {
        return $this->tone;
    }

    public function setTone(string $tone): static
    {
        $this->tone = $tone;
        return $this;
    }

    public function getAudience(): ?string
    {
        return $this->audience;
    }

    public function setAudience(?string $audience): static
    {
        $this->audience = $audience;
        return $this;
    }

    public function getBeginning(): ?string
    {
        return $this->beginning;
    }

    public function setBeginning(?string $beginning): static
    {
        $this->beginning = $beginning;
        return $this;
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function setArticle(?Article $article): static
    {
        if ($article === null && $this->article !== null) {
            $this->article->setEditArticle(null);
        }

        if ($article !== null && $article->getEditArticle() !== $this) {
            $article->setEditArticle($this);
        }

        $this->article = $article;
        return $this;
    }
}
