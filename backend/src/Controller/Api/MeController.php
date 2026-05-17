<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\JwtAuthService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/me')]
class MeController extends ApiAbstractController
{
    private const NAME_MAX = 100;
    private const EMAIL_MAX = 255;
    private const BIO_MAX = 1000;
    private const AVATAR_MAX = 500;
    private const PASSWORD_MIN = 6;
    private const PASSWORD_MAX = 200;
    private const WORDS_MIN = 100;
    private const WORDS_MAX = 5000;
    private const ALLOWED_LANGUAGES = ['fr', 'en'];
    private const ALLOWED_THEMES = ['light', 'dark', 'system'];
    private const ALLOWED_TONES = ['professional', 'casual', 'friendly', 'formal', 'enthusiastic'];

    private const NOTIFICATION_FIELDS = [
        'notifEmail' => 'setNotifEmail',
        'notifWeekly' => 'setNotifWeekly',
        'notifAi' => 'setNotifAi',
        'notifComments' => 'setNotifComments',
        'notifUpdates' => 'setNotifUpdates',
        'notifTips' => 'setNotifTips',
    ];

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('', name: 'api_me_read', methods: ['GET'])]
    public function read(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->serialize($user));
    }

    #[Route('', name: 'api_me_update', methods: ['PUT'])]
    public function update(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $error = $this->applyProfilePayload($user, $data);
        if ($error !== null) {
            return $this->json(['error' => $error], Response::HTTP_BAD_REQUEST);
        }

        $user->setUpdatedAt(new \DateTime());

        try {
            $this->em->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Erreur lors de la sauvegarde du profil.', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Erreur interne lors de la sauvegarde.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json($this->serialize($user));
    }

    #[Route('/password', name: 'api_me_password', methods: ['PUT'])]
    public function changePassword(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $current = isset($data['currentPassword']) && is_string($data['currentPassword']) ? $data['currentPassword'] : '';
        $new = isset($data['newPassword']) && is_string($data['newPassword']) ? $data['newPassword'] : '';

        if ($current === '' || $new === '') {
            return $this->json(['error' => 'Le mot de passe actuel et le nouveau mot de passe sont requis.'], Response::HTTP_BAD_REQUEST);
        }
        if (mb_strlen($new) < self::PASSWORD_MIN || mb_strlen($new) > self::PASSWORD_MAX) {
            return $this->json(
                ['error' => 'Le nouveau mot de passe doit contenir entre ' . self::PASSWORD_MIN . ' et ' . self::PASSWORD_MAX . ' caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        if (!password_verify($current, $user->getPassword())) {
            return $this->json(['error' => 'Mot de passe actuel incorrect.'], Response::HTTP_UNAUTHORIZED);
        }

        $user->setPassword(password_hash($new, PASSWORD_BCRYPT));
        $user->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json(['message' => 'Mot de passe mis à jour.']);
    }

    #[Route('/notifications', name: 'api_me_notifications', methods: ['PUT'])]
    public function updateNotifications(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        foreach (self::NOTIFICATION_FIELDS as $field => $setter) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];
                if (!is_bool($value)) {
                    return $this->json(['error' => 'Le champ ' . $field . ' doit être un booléen.'], Response::HTTP_BAD_REQUEST);
                }
                $user->$setter($value);
            }
        }

        $user->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json($this->serialize($user));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);
        return is_array($data) ? $data : null;
    }

    /**
     * Applique le payload PATCH-style sur l'utilisateur. Renvoie null si OK, sinon un message d'erreur FR.
     *
     * @param array<string, mixed> $data
     */
    private function applyProfilePayload(User $user, array $data): ?string
    {
        if (array_key_exists('name', $data)) {
            if (!is_string($data['name'])) {
                return 'Le nom doit être une chaîne.';
            }
            $name = trim($data['name']);
            if ($name === '' || mb_strlen($name) > self::NAME_MAX) {
                return 'Le nom doit contenir entre 1 et ' . self::NAME_MAX . ' caractères.';
            }
            $user->setName($name);
        }

        if (array_key_exists('email', $data)) {
            if (!is_string($data['email'])) {
                return 'L\'email doit être une chaîne.';
            }
            $email = trim($data['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > self::EMAIL_MAX) {
                return 'Email invalide.';
            }
            if ($email !== $user->getEmail()) {
                $existing = $this->userRepository->findOneBy(['email' => $email]);
                if ($existing && $existing->getId() !== $user->getId()) {
                    return 'Cet email est déjà utilisé.';
                }
                $user->setEmail($email);
            }
        }

        if (array_key_exists('bio', $data)) {
            $bio = $data['bio'];
            if ($bio !== null && (!is_string($bio) || mb_strlen($bio) > self::BIO_MAX)) {
                return 'La bio doit faire au maximum ' . self::BIO_MAX . ' caractères.';
            }
            $user->setBio($bio);
        }

        if (array_key_exists('avatar', $data)) {
            $avatar = $data['avatar'];
            if ($avatar !== null && (!is_string($avatar) || mb_strlen($avatar) > self::AVATAR_MAX)) {
                return 'L\'URL de l\'avatar est trop longue (max ' . self::AVATAR_MAX . ' caractères).';
            }
            $user->setAvatar($avatar);
        }

        if (array_key_exists('language', $data)) {
            $language = $data['language'];
            if ($language !== null && (!is_string($language) || !in_array($language, self::ALLOWED_LANGUAGES, true))) {
                return 'Langue invalide.';
            }
            $user->setLanguage($language);
        }

        if (array_key_exists('theme', $data)) {
            $theme = $data['theme'];
            if (!is_string($theme) || !in_array($theme, self::ALLOWED_THEMES, true)) {
                return 'Thème invalide.';
            }
            $user->setTheme($theme);
        }

        if (array_key_exists('defaultTone', $data)) {
            $tone = $data['defaultTone'];
            if ($tone !== null && (!is_string($tone) || !in_array($tone, self::ALLOWED_TONES, true))) {
                return 'Ton par défaut invalide.';
            }
            $user->setDefaultTone($tone);
        }

        if (array_key_exists('defaultWords', $data)) {
            $words = $data['defaultWords'];
            if (!is_int($words) || $words < self::WORDS_MIN || $words > self::WORDS_MAX) {
                return 'Le nombre de mots par défaut doit être un entier entre ' . self::WORDS_MIN . ' et ' . self::WORDS_MAX . '.';
            }
            $user->setDefaultWords($words);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $user): array
    {
        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatar(),
            'bio' => $user->getBio(),
            'language' => $user->getLanguage(),
            'theme' => $user->getTheme(),
            'defaultTone' => $user->getDefaultTone(),
            'defaultWords' => $user->getDefaultWords(),
            'notifications' => [
                'email' => $user->isNotifEmail(),
                'weekly' => $user->isNotifWeekly(),
                'ai' => $user->isNotifAi(),
                'comments' => $user->isNotifComments(),
                'updates' => $user->isNotifUpdates(),
                'tips' => $user->isNotifTips(),
            ],
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'updatedAt' => $user->getUpdatedAt()?->format('c'),
            'lastLogin' => $user->getLastLogin()?->format('c'),
        ];
    }
}
