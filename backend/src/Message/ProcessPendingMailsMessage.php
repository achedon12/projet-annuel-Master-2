<?php

namespace App\Message;

/**
 * Message déclenché par le scheduler pour traiter un lot de pending_mails.
 */
final class ProcessPendingMailsMessage
{
    public function __construct(
        public readonly int $batchSize = 50,
    ) {}
}
