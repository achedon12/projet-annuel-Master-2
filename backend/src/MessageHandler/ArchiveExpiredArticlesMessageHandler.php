<?php

namespace App\MessageHandler;

use App\Message\ArchiveExpiredArticlesMessage;
use App\Service\ArticleLifecycleService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class ArchiveExpiredArticlesMessageHandler
{
    public function __construct(
        private ArticleLifecycleService $lifecycle,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ArchiveExpiredArticlesMessage $message): void
    {
        $count = $this->lifecycle->archiveExpired($message->retentionDays);

        if ($count === 0) {
            return;
        }

        $this->logger->info('Articles archivés par le scheduler.', ['count' => $count]);
    }
}
