<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Organization;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\JwtAuthService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Gestion des utilisateurs d'entreprise : une organisation regroupe des
 * membres, gérés par son propriétaire (owner).
 */
#[Route('/api/organization')]
class OrganizationController extends ApiAbstractController
{
    private const NAME_MIN = 2;
    private const NAME_MAX = 120;

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('', name: 'api_organization_get', methods: ['GET'])]
    public function get(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $org = $user->getOrganization();

        return $this->json(['organization' => $org ? $this->serialize($org, $user) : null]);
    }

    #[Route('', name: 'api_organization_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->getOrganization() !== null) {
            return $this->json(['error' => 'Vous appartenez déjà à une entreprise.'], Response::HTTP_CONFLICT);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
        if (mb_strlen($name) < self::NAME_MIN || mb_strlen($name) > self::NAME_MAX) {
            return $this->json(
                ['error' => 'Le nom doit contenir entre ' . self::NAME_MIN . ' et ' . self::NAME_MAX . ' caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $org = new Organization();
        $org->setName($name);
        $org->setOwner($user);
        $org->addMember($user);
        $this->em->persist($org);
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)], Response::HTTP_CREATED);
    }

    #[Route('/members', name: 'api_organization_add_member', methods: ['POST'])]
    public function addMember(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $org = $user->getOrganization();
        if ($org === null) {
            return $this->json(['error' => 'Créez d\'abord une entreprise.'], Response::HTTP_BAD_REQUEST);
        }
        if (!$org->isOwner($user)) {
            return $this->json(['error' => 'Seul le propriétaire peut ajouter des membres.'], Response::HTTP_FORBIDDEN);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) && is_string($data['email']) ? trim(mb_strtolower($data['email'])) : '';
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return $this->json(['error' => 'Adresse email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $target = $this->userRepository->findOneBy(['email' => $email]);
        if ($target === null) {
            return $this->json(['error' => 'Aucun utilisateur avec cet email.'], Response::HTTP_NOT_FOUND);
        }

        $current = $target->getOrganization();
        if ($current !== null) {
            $message = $current->getId() === $org->getId()
                ? 'Cet utilisateur est déjà membre de votre entreprise.'
                : 'Cet utilisateur appartient déjà à une autre entreprise.';
            return $this->json(['error' => $message], Response::HTTP_CONFLICT);
        }

        $org->addMember($target);
        $target->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)]);
    }

    #[Route('/members/{userId}', name: 'api_organization_remove_member', methods: ['DELETE'], requirements: ['userId' => '\d+'])]
    public function removeMember(int $userId, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $org = $user->getOrganization();
        if ($org === null) {
            return $this->json(['error' => 'Aucune entreprise.'], Response::HTTP_BAD_REQUEST);
        }
        if (!$org->isOwner($user)) {
            return $this->json(['error' => 'Seul le propriétaire peut retirer des membres.'], Response::HTTP_FORBIDDEN);
        }
        if ($org->getOwner() !== null && $org->getOwner()->getId() === $userId) {
            return $this->json(['error' => 'Le propriétaire ne peut pas être retiré.'], Response::HTTP_BAD_REQUEST);
        }

        $target = null;
        foreach ($org->getMembers() as $member) {
            if ($member->getId() === $userId) {
                $target = $member;
                break;
            }
        }
        if ($target === null) {
            return $this->json(['error' => 'Membre introuvable dans votre entreprise.'], Response::HTTP_NOT_FOUND);
        }

        $org->removeMember($target);
        $target->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)]);
    }

    private function decodeBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);
        return is_array($data) ? $data : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Organization $org, User $viewer): array
    {
        $members = [];
        foreach ($org->getMembers() as $member) {
            $members[] = [
                'id' => $member->getId(),
                'name' => $member->getName(),
                'email' => $member->getEmail(),
                'role' => $org->isOwner($member) ? 'owner' : 'member',
            ];
        }

        return [
            'id' => $org->getId(),
            'name' => $org->getName(),
            'isOwner' => $org->isOwner($viewer),
            'memberCount' => count($members),
            'members' => $members,
            'createdAt' => $org->getCreatedAt()?->format('c'),
        ];
    }
}
