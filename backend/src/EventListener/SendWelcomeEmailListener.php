<?php

namespace App\EventListener;

use App\Event\UserRegisteredEvent;
use App\Service\PendingMailQueue;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * EventListener qui pousse un email de bienvenue dans la queue lors de l'inscription.
 * L'envoi effectif est réalisé par la commande cron `app:mail:process`.
 */
class SendWelcomeEmailListener implements EventSubscriberInterface
{
    public function __construct(
        private PendingMailQueue $mailQueue,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            UserRegisteredEvent::NAME => 'onUserRegistered',
        ];
    }

    public function onUserRegistered(UserRegisteredEvent $event): void
    {
        $user = $event->getUser();

        try {
            $this->mailQueue->enqueue([
                'toEmail' => $user->getEmail(),
                'toName' => $user->getName(),
                'subject' => 'Bienvenue sur SEO Content AI!',
                'bodyHtml' => $this->getEmailContent($user),
            ]);
        } catch (\Throwable $e) {
            error_log('Failed to enqueue welcome email for ' . $user->getEmail() . ': ' . $e->getMessage());
        }
    }

    private function getEmailContent($user): string
    {
        $name = htmlspecialchars((string) $user->getName(), ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #0f766e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; background: #f8fafc; border-radius: 8px; }
        .content p { margin: 15px 0; line-height: 1.6; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenue, {$name}!</h1>
        </div>
        <div class="content">
            <p>Merci de vous être inscrit sur <strong>SEO Content AI</strong>!</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant:</p>
            <ul>
                <li>Générer du contenu optimisé SEO avec l'IA</li>
                <li>Créer des idées de contenu illimitées</li>
                <li>Éditer et améliorer vos articles</li>
                <li>Suivre l'historique de vos créations</li>
            </ul>
            <p>Accédez à votre tableau de bord pour commencer:</p>
            <center>
                <a href="http://localhost:3000/dashboard" class="button">Accéder à SEO Content AI</a>
            </center>
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2026 SEO Content AI. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
