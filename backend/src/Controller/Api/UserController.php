<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users')]
class UserController extends ApiAbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository         $userRepository,
        private readonly ValidatorInterface     $validator
    )
    {
    }

    // ==================== LIST ====================
    #[Route('', name: 'api_users_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $users = $this->userRepository->findAll();

        return $this->json(
            array_map(fn(User $user) => $this->serialize($user), $users)
        );
    }

    // ==================== SHOW ====================

    /**
     * Sérialise un User en tableau (jamais le mot de passe).
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
            'createdAt' => $user->getCreatedAt()?->format('c'),
            'updatedAt' => $user->getUpdatedAt()?->format('c'),
            'lastLogin' => $user->getLastLogin()?->format('c'),
        ];
    }

    // ==================== CREATE ====================

    #[Route('/{id}', name: 'api_users_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($user));
    }

    // ==================== UPDATE ====================

    #[Route('', name: 'api_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $user = new User();
        $this->hydrate($user, $data);

        // Hash du mot de passe
        if (isset($data['password'])) {
            $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
        }

        $errors = $this->validate($user);
        if ($errors) {
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($user);
        $this->em->flush();

        return $this->json($this->serialize($user), Response::HTTP_CREATED);
    }

    // ==================== DELETE ====================

    /**
     * Hydrate l'entité User à partir des données du JSON (sauf password).
     */
    private function hydrate(User $user, array $data): void
    {
        if (isset($data['name'])) {
            $user->setName($data['name']);
        }
        if (isset($data['email'])) {
            $user->setEmail($data['email']);
        }
        if (array_key_exists('avatar', $data)) {
            $user->setAvatar($data['avatar']);
        }
        if (array_key_exists('bio', $data)) {
            $user->setBio($data['bio']);
        }
        if (isset($data['language'])) {
            $user->setLanguage($data['language']);
        }
        if (isset($data['theme'])) {
            $user->setTheme($data['theme']);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Valide l'entité et retourne un tableau d'erreurs, ou null si valide.
     */
    private function validate(User $user): ?array
    {
        $violations = $this->validator->validate($user);

        if (count($violations) === 0) {
            return null;
        }

        $errors = [];
        foreach ($violations as $violation) {
            $errors[$violation->getPropertyPath()] = $violation->getMessage();
        }

        return $errors;
    }

    #[Route('/{id}', name: 'api_users_update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $this->hydrate($user, $data);

        // Hash du mot de passe si modifié
        if (isset($data['password'])) {
            $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
        }

        $user->setUpdatedAt(new \DateTime());

        $errors = $this->validate($user);
        if ($errors) {
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();

        return $this->json($this->serialize($user));
    }

    #[Route('/{id}', name: 'api_users_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
