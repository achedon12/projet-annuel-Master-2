<?php

namespace App\Entity;

use App\Repository\PendingMailRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PendingMailRepository::class)]
#[ORM\Table(name: 'pending_mails')]
#[ORM\Index(name: 'idx_pending_mails_status', columns: ['status'])]
#[ORM\Index(name: 'idx_pending_mails_status_created', columns: ['status', 'created_at'])]
class PendingMail
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    public const DEFAULT_MAX_ATTEMPTS = 3;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::BIGINT)]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private ?string $toEmail = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $toName = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $fromEmail = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $fromName = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private ?string $subject = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $bodyHtml = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bodyText = null;

    #[ORM\Column(type: Types::STRING, length: 20)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: Types::INTEGER)]
    private int $attempts = 0;

    #[ORM\Column(type: Types::INTEGER)]
    private int $maxAttempts = self::DEFAULT_MAX_ATTEMPTS;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $lastError = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastAttemptAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $sentAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToEmail(): ?string
    {
        return $this->toEmail;
    }

    public function setToEmail(string $toEmail): self
    {
        $this->toEmail = $toEmail;
        return $this;
    }

    public function getToName(): ?string
    {
        return $this->toName;
    }

    public function setToName(?string $toName): self
    {
        $this->toName = $toName;
        return $this;
    }

    public function getFromEmail(): ?string
    {
        return $this->fromEmail;
    }

    public function setFromEmail(?string $fromEmail): self
    {
        $this->fromEmail = $fromEmail;
        return $this;
    }

    public function getFromName(): ?string
    {
        return $this->fromName;
    }

    public function setFromName(?string $fromName): self
    {
        $this->fromName = $fromName;
        return $this;
    }

    public function getSubject(): ?string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): self
    {
        $this->subject = $subject;
        return $this;
    }

    public function getBodyHtml(): ?string
    {
        return $this->bodyHtml;
    }

    public function setBodyHtml(string $bodyHtml): self
    {
        $this->bodyHtml = $bodyHtml;
        return $this;
    }

    public function getBodyText(): ?string
    {
        return $this->bodyText;
    }

    public function setBodyText(?string $bodyText): self
    {
        $this->bodyText = $bodyText;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getAttempts(): int
    {
        return $this->attempts;
    }

    public function setAttempts(int $attempts): self
    {
        $this->attempts = $attempts;
        return $this;
    }

    public function incrementAttempts(): self
    {
        $this->attempts++;
        return $this;
    }

    public function getMaxAttempts(): int
    {
        return $this->maxAttempts;
    }

    public function setMaxAttempts(int $maxAttempts): self
    {
        $this->maxAttempts = $maxAttempts;
        return $this;
    }

    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    public function setLastError(?string $lastError): self
    {
        $this->lastError = $lastError;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getLastAttemptAt(): ?\DateTimeInterface
    {
        return $this->lastAttemptAt;
    }

    public function setLastAttemptAt(?\DateTimeInterface $lastAttemptAt): self
    {
        $this->lastAttemptAt = $lastAttemptAt;
        return $this;
    }

    public function getSentAt(): ?\DateTimeInterface
    {
        return $this->sentAt;
    }

    public function setSentAt(?\DateTimeInterface $sentAt): self
    {
        $this->sentAt = $sentAt;
        return $this;
    }
}
