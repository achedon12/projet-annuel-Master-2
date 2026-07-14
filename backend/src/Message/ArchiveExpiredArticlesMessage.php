<?php

namespace App\Message;

/**
 * Message déclenché par le scheduler pour archiver légèrement les articles
 * dont la rétention est dépassée.
 */
final class ArchiveExpiredArticlesMessage
{
    public function __construct(
        public readonly int $retentionDays = 30,
    ) {}
}
