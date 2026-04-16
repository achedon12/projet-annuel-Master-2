<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(max: 100)]
    private ?string $name = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank(message: "L'email est obligatoire.")]
    #[Assert\Email(message: "L'email '{{ value }}' n'est pas valide.")]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le mot de passe est obligatoire.')]
    #[Assert\Length(min: 6, minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.')]
    private ?string $password = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(length: 5, nullable: true)]
    #[Assert\Length(max: 5)]
    private ?string $language = null;

    #[ORM\Column(length: 10, options: ['default' => 'system'])]
    #[Assert\Choice(choices: ['light', 'dark', 'system'], message: 'Thème invalide.')]
    private string $theme = 'system';

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastLogin = null;

    /** @var Collection<int, Integration> */
    #[ORM\OneToMany(targetEntity: Integration::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private Collection $integrations;

    /** @var Collection<int, Idea> */
    #[ORM\OneToMany(targetEntity: Idea::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private Collection $ideas;

    /** @var Collection<int, Article> */
    #[ORM\OneToMany(targetEntity: Article::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private Collection $articles;

    /** @var Collection<int, EditArticle> */
    #[ORM\OneToMany(targetEntity: EditArticle::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private Collection $editArticles;

    public function __construct()
    {
        $this->integrations = new ArrayCollection();
        $this->ideas = new ArrayCollection();
        $this->articles = new ArrayCollection();
        $this->editArticles = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;
        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;
        return $this;
    }

    public function getLanguage(): ?string
    {
        return $this->language;
    }

    public function setLanguage(?string $language): static
    {
        $this->language = $language;
        return $this;
    }

    public function getTheme(): string
    {
        return $this->theme;
    }

    public function setTheme(string $theme): static
    {
        if (!in_array($theme, ['light', 'dark', 'system'])) {
            throw new \InvalidArgumentException("Invalid theme value: $theme");
        }
        $this->theme = $theme;
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

    public function getLastLogin(): ?\DateTimeInterface
    {
        return $this->lastLogin;
    }

    public function setLastLogin(?\DateTimeInterface $lastLogin): static
    {
        $this->lastLogin = $lastLogin;
        return $this;
    }

    /** @return Collection<int, Integration> */
    public function getIntegrations(): Collection
    {
        return $this->integrations;
    }

    public function addIntegration(Integration $integration): static
    {
        if (!$this->integrations->contains($integration)) {
            $this->integrations->add($integration);
            $integration->setUser($this);
        }
        return $this;
    }

    public function removeIntegration(Integration $integration): static
    {
        if ($this->integrations->removeElement($integration)) {
            if ($integration->getUser() === $this) {
                $integration->setUser(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, Idea> */
    public function getIdeas(): Collection
    {
        return $this->ideas;
    }

    public function addIdea(Idea $idea): static
    {
        if (!$this->ideas->contains($idea)) {
            $this->ideas->add($idea);
            $idea->setUser($this);
        }
        return $this;
    }

    public function removeIdea(Idea $idea): static
    {
        if ($this->ideas->removeElement($idea)) {
            if ($idea->getUser() === $this) {
                $idea->setUser(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, Article> */
    public function getArticles(): Collection
    {
        return $this->articles;
    }

    public function addArticle(Article $article): static
    {
        if (!$this->articles->contains($article)) {
            $this->articles->add($article);
            $article->setUser($this);
        }
        return $this;
    }

    public function removeArticle(Article $article): static
    {
        if ($this->articles->removeElement($article)) {
            if ($article->getUser() === $this) {
                $article->setUser(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, EditArticle> */
    public function getEditArticles(): Collection
    {
        return $this->editArticles;
    }

    public function addEditArticle(EditArticle $editArticle): static
    {
        if (!$this->editArticles->contains($editArticle)) {
            $this->editArticles->add($editArticle);
            $editArticle->setUser($this);
        }
        return $this;
    }

    public function removeEditArticle(EditArticle $editArticle): static
    {
        if ($this->editArticles->removeElement($editArticle)) {
            if ($editArticle->getUser() === $this) {
                $editArticle->setUser(null);
            }
        }
        return $this;
    }
}
