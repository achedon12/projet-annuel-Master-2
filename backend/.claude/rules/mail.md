# Mail — DB-backed queue + Scheduler

**Never call `MailerInterface` directly.** Always enqueue:

```php
$this->mailQueue->enqueue([
    'toEmail' => $user->getEmail(),
    'toName'  => $user->getName(),
    'subject' => '…',
    'bodyHtml'=> '…',
]);
```

`App\Service\PendingMailQueue::enqueue([...])` inserts a row into `pending_mails` with `status=pending`. See `App\EventListener\SendWelcomeEmailListener` for the reference implementation.

## Send loop — `App\Service\PendingMailProcessor::process($batchSize)`

1. Picks up to N (default 50) `pending` rows, flips them to `processing` (optimistic lock against concurrent workers), flushes once.
2. For each row: `attempts++`, `lastAttemptAt = now`, tries `mailer->send()`.
   - Success → `sent` + `sentAt = now`.
   - Failure with `attempts >= maxAttempts` (default 3) → `failed` permanent.
   - Failure with retries left → back to `pending` for the next tick.
3. Flushes after each row (no progress loss on crash).

## Two entry points

- `App\Command\ProcessPendingMailsCommand` (`app:mail:process`) — manual / external cron.
- `App\Scheduler\MailSchedule` (`#[AsSchedule('mail')]`) dispatches `ProcessPendingMailsMessage` every 1 minute → `ProcessPendingMailsMessageHandler` → processor. Worker: `messenger:consume scheduler_mail`.

To change cadence, edit `MailSchedule::getSchedule()`. The transport name `scheduler_mail` derives from the schedule name; no `messenger.yaml` change needed.

## Gotcha

`config/packages/messenger.yaml` routes `Symfony\Component\Mailer\Messenger\SendEmailMessage` to `async`, but the codebase doesn't actually dispatch mail through that path anymore — everything goes through the `PendingMail` queue. The async transport is still useful for other messages.
