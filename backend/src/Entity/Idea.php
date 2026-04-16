<?php

namespace App\Entity;

use App\Repository\IdeaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: IdeaRepository::class)]
class Idea
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'ideas')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    private ?string $keyword = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $audience = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $type = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    #[ORM\OneToOne(targetEntity: Article::class, mappedBy: 'idea')]
    private ?Article $article = null;

    #[ORM\OneToOne(targetEntity: EditArticle::class, mappedBy: 'idea')]
    private ?EditArticle $editArticle = null;

    public function __construct()
    {
        $this->date = new \DateTime();
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

    public function getKeyword(): ?string
    {
        return $this->keyword;
    }

    public function setKeyword(string $keyword): static
    {
        $this->keyword = $keyword;
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

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function setArticle(?Article $article): static
    {
        // unset the owning side of the relation if necessary
        if ($article === null && $this->article !== null) {
            $this->article->setIdea(null);
        }

        // set the owning side of the relation if necessary
        if ($article !== null && $article->getIdea() !== $this) {
            $article->setIdea($this);
        }

        $this->article = $article;
        return $this;
    }

    public function getEditArticle(): ?EditArticle
    {
        return $this->editArticle;
    }

    public function setEditArticle(?EditArticle $editArticle): static
    {
        if ($editArticle === null && $this->editArticle !== null) {
            $this->editArticle->setIdea(null);
        }

        if ($editArticle !== null && $editArticle->getIdea() !== $this) {
            $editArticle->setIdea($this);
        }

        $this->editArticle = $editArticle;
        return $this;
    }
}
