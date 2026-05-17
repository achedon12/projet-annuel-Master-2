<?php

namespace App\Service;

use App\Entity\PendingMail;
use App\Repository\PendingMailRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Traite un lot d'emails depuis la table `pending_mails`.
 * Utilisé par la commande `app:mail:process` et par le scheduler.
 */
class PendingMailProcessor
{
    public const DEFAULT_BATCH_SIZE = 50;
    public const DEFAULT_FROM_EMAIL = 'noreply@seocontent.ai';
    public const DEFAULT_FROM_NAME = 'SEO Content AI';

    public function __construct(
        private EntityManagerInterface $em,
        private PendingMailRepository $repository,
        private MailerInterface $mailer,
        private ?LoggerInterface $logger = null,
    ) {
        $this->logger ??= new NullLogger();
    }

    /**
     * @return array{sent:int, retry:int, failed:int, processed:int}
     */
    public function process(int $batchSize = self::DEFAULT_BATCH_SIZE): array
    {
        $batchSize = max(1, $batchSize);
        $mails = $this->repository->findPendingBatch($batchSize);
        $count = count($mails);

        if ($count === 0) {
            return ['sent' => 0, 'retry' => 0, 'failed' => 0, 'processed' => 0];
        }

        // Lock optimiste : on passe tout le lot en PROCESSING avant de commencer.
        foreach ($mails as $mail) {
            $mail->setStatus(PendingMail::STATUS_PROCESSING);
        }
        $this->em->flush();

        $sent = 0;
        $retry = 0;
        $failed = 0;

        foreach ($mails as $mail) {
            $mail->incrementAttempts();
            $mail->setLastAttemptAt(new \DateTime());

            try {
                $this->mailer->send($this->buildEmail($mail));
                $mail->setStatus(PendingMail::STATUS_SENT);
                $mail->setSentAt(new \DateTime());
                $mail->setLastError(null);
                $sent++;
            } catch (\Throwable $e) {
                $mail->setLastError(substr($e->getMessage(), 0, 2000));

                if ($mail->getAttempts() >= $mail->getMaxAttempts()) {
                    $mail->setStatus(PendingMail::STATUS_FAILED);
                    $failed++;
                    $this->logger->error('PendingMail permanently failed', [
                        'id' => $mail->getId(),
                        'to' => $mail->getToEmail(),
                        'attempts' => $mail->getAttempts(),
                        'error' => $e->getMessage(),
                    ]);
                } else {
                    $mail->setStatus(PendingMail::STATUS_PENDING);
                    $retry++;
                    $this->logger->warning('PendingMail will retry', [
                        'id' => $mail->getId(),
                        'to' => $mail->getToEmail(),
                        'attempts' => $mail->getAttempts(),
                        'maxAttempts' => $mail->getMaxAttempts(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $this->em->flush();
        }

        return [
            'sent' => $sent,
            'retry' => $retry,
            'failed' => $failed,
            'processed' => $count,
        ];
    }

    private function buildEmail(PendingMail $mail): Email
    {
        $fromEmail = $mail->getFromEmail() ?: self::DEFAULT_FROM_EMAIL;
        $fromName = $mail->getFromName() ?: self::DEFAULT_FROM_NAME;
        $toEmail = (string) $mail->getToEmail();
        $toName = $mail->getToName();

        $email = (new Email())
            ->from(new Address($fromEmail, $fromName))
            ->to($toName ? new Address($toEmail, $toName) : $toEmail)
            ->subject((string) $mail->getSubject())
            ->html((string) $mail->getBodyHtml());

        if ($mail->getBodyText()) {
            $email->text($mail->getBodyText());
        }

        return $email;
    }
}
