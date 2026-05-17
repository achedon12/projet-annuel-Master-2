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

    public const ROLE_USER = 'user';
    public const ROLE_ADMIN = 'admin';
    public const ROLES = [self::ROLE_USER, self::ROLE_ADMIN];

    #[ORM\Column(length: 20, options: ['default' => self::ROLE_USER])]
    #[Assert\Choice(choices: self::ROLES, message: 'Rôle invalide.')]
    private string $role = self::ROLE_USER;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $defaultTone = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 800])]
    private int $defaultWords = 800;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $notifEmail = true;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $notifWeekly = true;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $notifAi = true;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $notifComments = true;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $notifUpdates = true;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $notifTips = false;

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

    /** @var Collection<int, UserLoginIp> */
    #[ORM\OneToMany(targetEntity: UserLoginIp::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $loginIps;

    public function __construct()
    {
        $this->integrations = new ArrayCollection();
        $this->ideas = new ArrayCollection();
        $this->articles = new ArrayCollection();
        $this->editArticles = new ArrayCollection();
        $this->loginIps = new ArrayCollection();
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

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        if (!in_array($role, self::ROLES, true)) {
            throw new \InvalidArgumentException('Rôle invalide : ' . $role);
        }
        $this->role = $role;
        return $this;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function getDefaultTone(): ?string
    {
        return $this->defaultTone;
    }

    public function setDefaultTone(?string $defaultTone): static
    {
        $this->defaultTone = $defaultTone;
        return $this;
    }

    public function getDefaultWords(): int
    {
        return $this->defaultWords;
    }

    public function setDefaultWords(int $defaultWords): static
    {
        $this->defaultWords = $defaultWords;
        return $this;
    }

    public function isNotifEmail(): bool
    {
        return $this->notifEmail;
    }

    public function setNotifEmail(bool $value): static
    {
        $this->notifEmail = $value;
        return $this;
    }

    public function isNotifWeekly(): bool
    {
        return $this->notifWeekly;
    }

    public function setNotifWeekly(bool $value): static
    {
        $this->notifWeekly = $value;
        return $this;
    }

    public function isNotifAi(): bool
    {
        return $this->notifAi;
    }

    public function setNotifAi(bool $value): static
    {
        $this->notifAi = $value;
        return $this;
    }

    public function isNotifComments(): bool
    {
        return $this->notifComments;
    }

    public function setNotifComments(bool $value): static
    {
        $this->notifComments = $value;
        return $this;
    }

    public function isNotifUpdates(): bool
    {
        return $this->notifUpdates;
    }

    public function setNotifUpdates(bool $value): static
    {
        $this->notifUpdates = $value;
        return $this;
    }

    public function isNotifTips(): bool
    {
        return $this->notifTips;
    }

    public function setNotifTips(bool $value): static
    {
        $this->notifTips = $value;
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

    /** @return Collection<int, UserLoginIp> */
    public function getLoginIps(): Collection
    {
        return $this->loginIps;
    }

    public function addLoginIp(UserLoginIp $loginIp): static
    {
        if (!$this->loginIps->contains($loginIp)) {
            $this->loginIps->add($loginIp);
            $loginIp->setUser($this);
        }
        return $this;
    }

    public function removeLoginIp(UserLoginIp $loginIp): static
    {
        if ($this->loginIps->removeElement($loginIp)) {
            if ($loginIp->getUser() === $this) {
                $loginIp->setUser(null);
            }
        }
        return $this;
    }
}
