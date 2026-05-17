<?php

namespace App\MessageHandler;

use App\Message\ProcessPendingMailsMessage;
use App\Service\PendingMailProcessor;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class ProcessPendingMailsMessageHandler
{
    public function __construct(
        private PendingMailProcessor $processor,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ProcessPendingMailsMessage $message): void
    {
        $stats = $this->processor->process($message->batchSize);

        if ($stats['processed'] === 0) {
            return;
        }

        $this->logger->info('PendingMail batch processed by scheduler', $stats);
    }
}
