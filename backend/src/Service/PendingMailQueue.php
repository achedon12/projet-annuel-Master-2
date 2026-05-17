<?php

namespace App\Service;

use App\Entity\PendingMail;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Pousse des emails dans la table `pending_mails`.
 * Le cron `app:mail:process` se charge ensuite de les envoyer par lot.
 */
class PendingMailQueue
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    /**
     * @param array{
     *     toEmail: string,
     *     toName?: string|null,
     *     subject: string,
     *     bodyHtml: string,
     *     bodyText?: string|null,
     *     fromEmail?: string|null,
     *     fromName?: string|null,
     *     maxAttempts?: int|null,
     * } $params
     */
    public function enqueue(array $params): PendingMail
    {
        $mail = new PendingMail();
        $mail->setToEmail($params['toEmail']);
        $mail->setToName($params['toName'] ?? null);
        $mail->setSubject($params['subject']);
        $mail->setBodyHtml($params['bodyHtml']);
        $mail->setBodyText($params['bodyText'] ?? null);
        $mail->setFromEmail($params['fromEmail'] ?? null);
        $mail->setFromName($params['fromName'] ?? null);
        if (!empty($params['maxAttempts'])) {
            $mail->setMaxAttempts((int) $params['maxAttempts']);
        }

        $this->em->persist($mail);
        $this->em->flush();

        return $mail;
    }
}
