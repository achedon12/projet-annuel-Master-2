<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\LoginToken;
use App\Entity\User;
use App\Event\UserRegisteredEvent;
use App\Repository\InvitationRepository;
use App\Repository\LoginTokenRepository;
use App\Repository\UserRepository;
use App\Service\GoogleAuthService;
use App\Service\InvitationService;
use App\Service\OrganizationPermissions;
use App\Service\PendingMailQueue;
use App\Service\UserLoginIpRecorder;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
class AuthController extends ApiAbstractController
{
    private string $jwtAlgorithm = 'HS256';

    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private ValidatorInterface $validator,
        private ParameterBagInterface $params,
        private EventDispatcherInterface $eventDispatcher,
        private UserLoginIpRecorder $loginIpRecorder,
        private GoogleAuthService $googleAuth,
        private LoginTokenRepository $loginTokenRepository,
        private PendingMailQueue $mailQueue,
        private InvitationRepository $invitationRepository,
        private InvitationService $invitations,
    ) {}

    /**
     * Consultation publique d'une invitation via son jeton : le front l'appelle
     * sur /accept-invite pour afficher l'entreprise et l'email pré-rempli.
     */
    #[Route('/invitation', name: 'api_auth_invitation_lookup', methods: ['GET'])]
    public function invitationLookup(Request $request): JsonResponse
    {
        $token = trim((string) $request->query->get('token', ''));
        if ($token === '') {
            return $this->json(['error' => 'Jeton manquant.'], Response::HTTP_BAD_REQUEST);
        }

        $invitation = $this->invitationRepository->findValidByTokenHash($this->invitations->hash($token));
        if ($invitation === null) {
            return $this->json(['error' => 'Invitation invalide ou expirée.'], Response::HTTP_GONE);
        }

        // Si un compte existe déjà pour cet email, l'inscription ne s'applique
        // pas : on le signale pour que le front oriente vers la connexion.
        $existing = $this->userRepository->findOneBy(['email' => $invitation->getEmail()]) !== null;

        return $this->json([
            'email' => $invitation->getEmail(),
            'organizationName' => $invitation->getOrganization()?->getName(),
            'userExists' => $existing,
        ]);
    }

    /**
     * Acceptation d'une invitation avec création du sous-compte : l'invité
     * choisit son mot de passe, le User + son rattachement à l'entreprise
     * (avec les permissions de l'invitation) sont créés en une transaction.
     * Renvoie { token, user } pour connecter directement, comme /signup.
     */
    #[Route('/accept-invitation', name: 'api_auth_accept_invitation', methods: ['POST'])]
    public function acceptInvitation(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $token = is_array($data) && isset($data['token']) && is_string($data['token']) ? trim($data['token']) : '';
        $password = is_array($data) && isset($data['password']) && is_string($data['password']) ? $data['password'] : '';
        $name = is_array($data) && isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';

        if ($token === '') {
            return $this->json(['error' => 'Jeton manquant.'], Response::HTTP_BAD_REQUEST);
        }
        if (mb_strlen($password) < 8) {
            return $this->json(['error' => 'Le mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $invitation = $this->invitationRepository->findValidByTokenHash($this->invitations->hash($token));
        if ($invitation === null) {
            return $this->json(['error' => 'Invitation invalide ou expirée.'], Response::HTTP_GONE);
        }

        $email = $invitation->getEmail();
        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(
                ['error' => 'Un compte existe déjà pour cet email. Connectez-vous plutôt.'],
                Response::HTTP_CONFLICT,
            );
        }

        $organization = $invitation->getOrganization();
        if ($organization === null) {
            return $this->json(['error' => 'Entreprise introuvable.'], Response::HTTP_GONE);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setName($name !== '' ? mb_substr($name, 0, 100) : $email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        $organization->addMember($user);
        $user->setOrgPermissions(OrganizationPermissions::normalize($invitation->getPermissions()));
        $invitation->setAcceptedAt(new \DateTime());

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $msg = [];
            foreach ($errors as $err) {
                $msg[$err->getPropertyPath()] = $err->getMessage();
            }
            return $this->json(['errors' => $msg], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($user);
        $this->em->flush();

        $this->loginIpRecorder->record($user, $request, 'signup');

        return $this->json([
            'message' => 'Compte créé.',
            'token' => $this->generateJWT($user),
            'user' => $this->serializeUser($user),
        ], Response::HTTP_CREATED);
    }

    #[Route('/magic-link', name: 'api_auth_magic_link', methods: ['POST'])]
    public function magicLink(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = is_array($data) && isset($data['email']) && is_string($data['email']) ? trim(mb_strtolower($data['email'])) : '';

        // Réponse générique quoi qu'il arrive : on ne révèle pas si l'email existe.
        $genericResponse = $this->json(['message' => 'Si un compte existe, un lien de connexion a été envoyé.']);

        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return $genericResponse;
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            return $genericResponse;
        }

        $token = bin2hex(random_bytes(32));
        $loginToken = new LoginToken();
        $loginToken->setUser($user);
        $loginToken->setToken($token);
        $loginToken->setExpiresAt((new \DateTime())->modify('+15 minutes'));
        $this->em->persist($loginToken);
        $this->em->flush();

        $base = $this->resolveFrontendBase($request);
        $link = $base . '/auth/magic?token=' . $token;

        $this->mailQueue->enqueue([
            'toEmail' => $user->getEmail(),
            'toName' => $user->getName(),
            'subject' => 'Votre lien de connexion',
            'bodyHtml' => sprintf(
                '<p>Bonjour %s,</p><p>Cliquez sur le lien ci-dessous pour vous connecter sans mot de passe. '
                . 'Ce lien expire dans 15 minutes et ne fonctionne qu\'une seule fois.</p>'
                . '<p><a href="%s">Se connecter</a></p>'
                . '<p>Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.</p>',
                htmlspecialchars((string) $user->getName(), ENT_QUOTES),
                htmlspecialchars($link, ENT_QUOTES),
            ),
        ]);

        return $genericResponse;
    }

    #[Route('/magic-login', name: 'api_auth_magic_login', methods: ['POST'])]
    public function magicLogin(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $token = is_array($data) && isset($data['token']) && is_string($data['token']) ? trim($data['token']) : '';

        if ($token === '') {
            return $this->json(['error' => 'Jeton manquant.'], Response::HTTP_BAD_REQUEST);
        }

        $loginToken = $this->loginTokenRepository->findValid($token);
        if ($loginToken === null) {
            return $this->json(['error' => 'Lien de connexion invalide ou expiré.'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $loginToken->getUser();
        $loginToken->setUsedAt(new \DateTime());
        $user->setLastLogin(new \DateTime());
        $this->em->flush();

        $this->loginIpRecorder->record($user, $request, 'login');

        return $this->json([
            'message' => 'Connexion réussie.',
            'token' => $this->generateJWT($user),
            'user' => $this->serializeUser($user),
        ]);
    }

    /**
     * Détermine l'URL de base du frontend pour construire le lien magique :
     * l'Origin de la requête si c'est une origine autorisée, sinon un défaut.
     */
    private function resolveFrontendBase(Request $request): string
    {
        $origin = $request->headers->get('Origin');
        if (is_string($origin) && preg_match('#^https?://[^/]+$#', $origin) === 1) {
            return rtrim($origin, '/');
        }
        $env = getenv('FRONTEND_URL');

        return is_string($env) && $env !== '' ? rtrim($env, '/') : 'http://localhost:3000';
    }

    #[Route('/signup', name: 'api_auth_signup', methods: ['POST'])]
    public function signup(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['name'], $data['email'], $data['password'])) {
            return $this->json(
                ['error' => 'Données manquantes (name, email, password requis).'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $name = trim($data['name']);
        $email = trim($data['email']);
        $password = $data['password'];

        $existingUser = $this->userRepository->findOneBy(['email' => $email]);
        if ($existingUser) {
            return $this->json(
                ['error' => 'Cet email est déjà utilisé.'],
                Response::HTTP_CONFLICT
            );
        }

        $user = new User();
        $user->setName($name);
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        $user->setTheme($data['theme'] ?? 'system');
        $user->setLanguage($data['language'] ?? null);

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(
                ['errors' => $errorMessages],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $this->em->persist($user);
        $this->em->flush();

        $this->eventDispatcher->dispatch(new UserRegisteredEvent($user), UserRegisteredEvent::NAME);

        $this->loginIpRecorder->record($user, $request, 'signup');

        $token = $this->generateJWT($user);

        return $this->json([
            'message' => 'Inscription réussie.',
            'token' => $token,
            'user' => $this->serializeUser($user),
        ], Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['email'], $data['password'])) {
            return $this->json(
                ['error' => 'Email et mot de passe requis.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $email = trim($data['email']);
        $password = $data['password'];

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(
                ['error' => 'Email ou mot de passe incorrect.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        if (!password_verify($password, $user->getPassword())) {
            return $this->json(
                ['error' => 'Email ou mot de passe incorrect.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        $user->setLastLogin(new \DateTime());
        $this->em->flush();

        $this->loginIpRecorder->record($user, $request, 'login');

        $token = $this->generateJWT($user);

        return $this->json([
            'message' => 'Connexion réussie.',
            'token' => $token,
            'user' => $this->serializeUser($user),
        ], Response::HTTP_OK);
    }

    #[Route('/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json([
            'message' => 'Déconnexion réussie.',
        ], Response::HTTP_OK);
    }

    /**
     * Sign-In / Sign-Up Google. Reçoit un id_token Google, le vérifie via JWKS,
     * crée le user s'il n'existe pas (avec un mot de passe aléatoire, jamais
     * communiqué), et retourne le même shape { token, user } que /login.
     */
    #[Route('/google', name: 'api_auth_google', methods: ['POST'])]
    public function google(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || !isset($data['idToken']) || !is_string($data['idToken']) || trim($data['idToken']) === '') {
            return $this->json(['error' => 'idToken manquant.'], Response::HTTP_BAD_REQUEST);
        }

        $idToken = trim($data['idToken']);
        // Les id_tokens Google légitimes font ~1-2 KB ; au-delà, c'est forcément
        // invalide. Fail-fast avant l'appel JWKS qui ferait du réseau pour rien.
        if (mb_strlen($idToken) > 4000) {
            return $this->json(['error' => 'idToken Google trop long.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $payload = $this->googleAuth->verifyIdToken($idToken);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        }

        $email = mb_strtolower(trim((string) $payload['email']));
        $name = isset($payload['name']) && is_string($payload['name']) && trim($payload['name']) !== ''
            ? trim($payload['name'])
            : $email;
        $avatar = isset($payload['picture']) && is_string($payload['picture']) ? $payload['picture'] : null;

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if (!$user) {
            $user = new User();
            $user->setEmail($email);
            $user->setName(mb_substr($name, 0, 100));
            // Mot de passe aléatoire jamais communiqué : empêche le login local
            // tant que le user n'a pas explicitement défini un mot de passe.
            $user->setPassword(password_hash(bin2hex(random_bytes(32)), PASSWORD_BCRYPT));
            if ($avatar !== null && mb_strlen($avatar) <= 1000) {
                $user->setAvatar($avatar);
            }

            $errors = $this->validator->validate($user);
            if (count($errors) > 0) {
                $msg = [];
                foreach ($errors as $err) {
                    $msg[$err->getPropertyPath()] = $err->getMessage();
                }
                return $this->json(['errors' => $msg], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $this->em->persist($user);
            $this->em->flush();

            $this->eventDispatcher->dispatch(new UserRegisteredEvent($user), UserRegisteredEvent::NAME);
            $this->loginIpRecorder->record($user, $request, 'signup');
        } else {
            $this->loginIpRecorder->record($user, $request, 'login');
        }

        $user->setLastLogin(new \DateTime());
        $this->em->flush();

        return $this->json([
            'message' => 'Connexion Google réussie.',
            'token' => $this->generateJWT($user),
            'user' => $this->serializeUser($user),
        ], Response::HTTP_OK);
    }

    /**
     * Génère un JWT pour l'utilisateur
     */
    private function generateJWT(User $user): string
    {
        $issuedAt = new \DateTimeImmutable();
        $expire = $issuedAt->modify('+7 days');
        $jwtSecret = $this->params->get('kernel.project_dir') . '/../.env' !== '' 
            ? getenv('JWT_SECRET') 
            : 'your_super_secret_jwt_key_change_this_in_production_12345';

        $payload = [
            'iat' => $issuedAt->getTimestamp(),
            'exp' => $expire->getTimestamp(),
            'userId' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
        ];

        return JWT::encode($payload, $jwtSecret ?: 'your_super_secret_jwt_key_change_this_in_production_12345', $this->jwtAlgorithm);
    }

    /**
     * Sérialise un User (sans mot de passe)
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatar(),
            'bio' => $user->getBio(),
            'language' => $user->getLanguage(),
            'theme' => $user->getTheme(),
            'role' => $user->getRole(),
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'updatedAt' => $user->getUpdatedAt()?->format('c'),
            'lastLogin' => $user->getLastLogin()?->format('c'),
        ];
    }
}
