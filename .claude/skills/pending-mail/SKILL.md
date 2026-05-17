---
name: pending-mail
description: Use when the user asks to send a transactional email from the backend — welcome, reset password, IP alert, notifications, etc. Covers the invariant "never call `MailerInterface` directly, always enqueue via `PendingMailQueue::enqueue()`", the HTML template format, and the fact that delivery happens asynchronously via the `MailSchedule` ticking every minute.
---

# Ajouter un envoi d'email

## La règle

**Jamais** `MailerInterface->send($email)` direct. Toujours **enqueue** :

```php
$this->mailQueue->enqueue([
    'toEmail' => $user->getEmail(),
    'toName'  => $user->getName(),
    'subject' => 'Sujet',
    'bodyHtml'=> $this->getEmailContent($user),
]);
```

L'envoi est différé. `App\Scheduler\MailSchedule` déclenche `ProcessPendingMailsMessage` toutes les minutes, qui appelle `PendingMailProcessor::process(50)`. Si l'envoi échoue, jusqu'à 3 tentatives (`maxAttempts` par défaut, override possible par `enqueue([... 'maxAttempts' => 5])`).

## Squelette d'un nouveau listener email

```php
<?php
namespace App\EventListener;

use App\Event\MyEvent;
use App\Service\PendingMailQueue;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class MyEmailListener implements EventSubscriberInterface
{
    public function __construct(
        private PendingMailQueue $mailQueue,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [MyEvent::NAME => 'onMyEvent'];
    }

    public function onMyEvent(MyEvent $event): void
    {
        try {
            $this->mailQueue->enqueue([
                'toEmail'  => $event->getUser()->getEmail(),
                'toName'   => $event->getUser()->getName(),
                'subject'  => 'Sujet contextuel',
                'bodyHtml' => $this->getHtml($event),
            ]);
        } catch (\Throwable $e) {
            error_log('Failed to enqueue mail: ' . $e->getMessage());
        }
    }

    private function getHtml(MyEvent $event): string
    {
        $name = htmlspecialchars((string) $event->getUser()->getName(), ENT_QUOTES, 'UTF-8');
        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
    <p>Bonjour {$name},</p>
    <p>… contenu …</p>
</body></html>
HTML;
    }
}
```

## Référence implémentation

`App\EventListener\SendWelcomeEmailListener` — exemple complet (template HTML inline, listener sur `UserRegisteredEvent`).

## Sécurité

**Toujours** `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` sur tout contenu utilisateur injecté dans le HTML. Le contenu va directement dans `body_html` en DB puis dans l'email — pas de templating engine intermédiaire qui échappe pour toi.

## Tester

1. MailHog tourne déjà via `docker compose up -d` (interface web sur `http://localhost:8025`).
2. Déclencher l'événement (inscription, action user…).
3. Vérifier la table `pending_mails` (status passe `pending` → `processing` → `sent` au prochain tick).
4. Forcer le tick manuellement :
   ```bash
   php bin/console app:mail:process --batch-size=50
   ```
5. Le mail apparaît dans MailHog.

Pour observer le scheduler en live :

```bash
php bin/console messenger:consume scheduler_mail -vv
```

## Quand utiliser un sujet/contenu dépendant du locale utilisateur

Le `User` a un champ `language` (`?string`). Si tu veux un email localisé, lis-le avant `enqueue` et construis le sujet + HTML dans la bonne langue. Il n'y a pas de helper i18n côté backend pour l'instant — le service `App\Service\Translator` existe mais n'est pas câblé. À ce stade, si tu as besoin de localiser, fais-le inline avec un `match` ou un dictionnaire local au listener.

## Pièges

- **Ne pas spawner un envoi depuis un controller HTTP** sans passer par un événement + listener — le couplage devient difficile à maintenir. Préférer dispatch d'event + listener qui enqueue.
- **`from_email` / `from_name`** sont optionnels — si omis, le processor utilise `noreply@seocontent.ai` / `SEO Content AI`. Override seulement si nécessaire.
- **Ne jamais retraiter un mail en `failed`** manuellement en le repassant en `pending` — préférer enqueue un nouveau record et marquer l'ancien comme observé.
