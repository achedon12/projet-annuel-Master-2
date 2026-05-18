<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\User;
use App\Event\UserRegisteredEvent;
use App\Repository\UserRepository;
use App\Service\GoogleAuthService;
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
    ) {}

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

        try {
            $payload = $this->googleAuth->verifyIdToken(trim($data['idToken']));
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
