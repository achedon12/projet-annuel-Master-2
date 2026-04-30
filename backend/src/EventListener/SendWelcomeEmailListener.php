<?php

namespace App\EventListener;

use App\Event\UserRegisteredEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * EventListener qui envoie un email de confirmation lors de l'inscription d'un utilisateur
 *
 * Cet EventListener est automatiquement appelé par Symfony sur l'événement user.registered
 * grâce à l'implémentation de EventSubscriberInterface et l'autoconfiguration dans services.yaml
 */
class SendWelcomeEmailListener implements EventSubscriberInterface
{
    public function __construct(
        private MailerInterface $mailer,
    ) {}

    /**
     * Enregistre cet event listener pour l'événement user.registered
     */
    public static function getSubscribedEvents(): array
    {
        return [
            UserRegisteredEvent::NAME => 'onUserRegistered',
        ];
    }

    /**
     * Envoie un email de bienvenue lors de l'inscription
     */
    public function onUserRegistered(UserRegisteredEvent $event): void
    {
        $user = $event->getUser();

        $email = (new Email())
            ->from('noreply@seocontent.ai')
            ->to($user->getEmail())
            ->subject('Bienvenue sur SEO Content AI!')
            ->html($this->getEmailContent($user));

        try {
            $this->mailer->send($email);
        } catch (\Exception $e) {
            error_log('Failed to send welcome email to ' . $user->getEmail() . ': ' . $e->getMessage());
        }
    }

    /**
     * Génère le contenu HTML de l'email de bienvenue
     */
    private function getEmailContent($user): string
    {
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
            <h1>Bienvenue, {$user->getName()}!</h1>
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
