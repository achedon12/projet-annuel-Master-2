<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Organization;
use App\Entity\User;
use App\Repository\InvitationRepository;
use App\Repository\UserRepository;
use App\Service\InvitationService;
use App\Service\JwtAuthService;
use App\Service\OrganizationAccess;
use App\Service\OrganizationPermissions;
use App\Service\PendingMailQueue;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Gestion des sous-comptes d'entreprise : une organisation regroupe des
 * membres, gérés par son propriétaire (owner). Deux façons d'ajouter un
 * membre : invitation par email (l'invité choisit son mot de passe) ou
 * création directe d'un sous-compte par l'owner. Chaque membre porte un jeu
 * de permissions (cf. OrganizationPermissions).
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
        private readonly InvitationRepository $invitationRepository,
        private readonly InvitationService $invitations,
        private readonly OrganizationAccess $access,
        private readonly PendingMailQueue $mailQueue,
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
        // L'owner n'a pas de permissions stockées : il a tous les droits.
        $user->setOrgPermissions(null);
        $this->em->persist($org);
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)], Response::HTTP_CREATED);
    }

    /**
     * Création directe d'un sous-compte par l'owner (email + mot de passe +
     * permissions), sans email d'invitation.
     */
    #[Route('/members', name: 'api_organization_add_member', methods: ['POST'])]
    public function addMember(Request $request): JsonResponse
    {
        [$user, $org, $error] = $this->requireOwner($request);
        if ($error !== null) {
            return $error;
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) && is_string($data['email']) ? trim(mb_strtolower($data['email'])) : '';
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return $this->json(['error' => 'Adresse email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $password = isset($data['password']) && is_string($data['password']) ? $data['password'] : '';
        if (mb_strlen($password) < 8) {
            return $this->json(['error' => 'Le mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
        }

        $name = isset($data['name']) && is_string($data['name']) && trim($data['name']) !== ''
            ? mb_substr(trim($data['name']), 0, 100)
            : $email;

        $member = new User();
        $member->setEmail($email);
        $member->setName($name);
        $member->setPassword(password_hash($password, PASSWORD_BCRYPT));
        $org->addMember($member);
        $member->setOrgPermissions(OrganizationPermissions::normalize($data['permissions'] ?? null));

        $this->em->persist($member);
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)], Response::HTTP_CREATED);
    }

    /**
     * Mise à jour des permissions d'un membre (owner uniquement).
     */
    #[Route('/members/{userId}', name: 'api_organization_update_member', methods: ['PATCH'], requirements: ['userId' => '\d+'])]
    public function updateMember(int $userId, Request $request): JsonResponse
    {
        [$user, $org, $error] = $this->requireOwner($request);
        if ($error !== null) {
            return $error;
        }

        if ($org->getOwner() !== null && $org->getOwner()->getId() === $userId) {
            return $this->json(['error' => 'Les permissions du propriétaire ne se modifient pas.'], Response::HTTP_BAD_REQUEST);
        }

        $target = $this->findMember($org, $userId);
        if ($target === null) {
            return $this->json(['error' => 'Membre introuvable dans votre entreprise.'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->decodeBody($request);
        if ($data === null || !isset($data['permissions']) || !is_array($data['permissions'])) {
            return $this->json(['error' => 'Permissions manquantes.'], Response::HTTP_BAD_REQUEST);
        }

        $target->setOrgPermissions(OrganizationPermissions::normalize($data['permissions']));
        $target->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)]);
    }

    #[Route('/members/{userId}', name: 'api_organization_remove_member', methods: ['DELETE'], requirements: ['userId' => '\d+'])]
    public function removeMember(int $userId, Request $request): JsonResponse
    {
        [$user, $org, $error] = $this->requireOwner($request);
        if ($error !== null) {
            return $error;
        }

        if ($org->getOwner() !== null && $org->getOwner()->getId() === $userId) {
            return $this->json(['error' => 'Le propriétaire ne peut pas être retiré.'], Response::HTTP_BAD_REQUEST);
        }

        $target = $this->findMember($org, $userId);
        if ($target === null) {
            return $this->json(['error' => 'Membre introuvable dans votre entreprise.'], Response::HTTP_NOT_FOUND);
        }

        $org->removeMember($target);
        $target->setOrgPermissions(null);
        $target->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)]);
    }

    /**
     * Invitation par email : crée une invitation et envoie le lien. Autorisée
     * à l'owner ou à un membre disposant de canInviteUsers.
     */
    #[Route('/invitations', name: 'api_organization_invite', methods: ['POST'])]
    public function invite(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        $org = $user->getOrganization();
        if ($org === null) {
            return $this->json(['error' => 'Créez d\'abord une entreprise.'], Response::HTTP_BAD_REQUEST);
        }
        if (!$this->access->can($user, OrganizationPermissions::CAN_INVITE_USERS)) {
            return $this->json(['error' => 'Vous n\'avez pas le droit d\'inviter des membres.'], Response::HTTP_FORBIDDEN);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) && is_string($data['email']) ? trim(mb_strtolower($data['email'])) : '';
        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return $this->json(['error' => 'Adresse email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $existing = $this->userRepository->findOneBy(['email' => $email]);
        if ($existing !== null) {
            $message = $existing->getOrganization()?->getId() === $org->getId()
                ? 'Cet utilisateur est déjà membre de votre entreprise.'
                : 'Cet email possède déjà un compte.';
            return $this->json(['error' => $message], Response::HTTP_CONFLICT);
        }

        if ($this->invitationRepository->findPendingForEmail($org, $email) !== null) {
            return $this->json(['error' => 'Une invitation est déjà en attente pour cet email.'], Response::HTTP_CONFLICT);
        }

        $permissions = OrganizationPermissions::normalize($data['permissions'] ?? null);
        $issued = $this->invitations->issue($org, $user, $email, $permissions);

        $base = $this->resolveFrontendBase($request);
        $link = $base . '/accept-invite?token=' . $issued['token'];

        $this->mailQueue->enqueue([
            'toEmail' => $email,
            'toName' => $email,
            'subject' => 'Invitation à rejoindre ' . $org->getName(),
            'bodyHtml' => sprintf(
                '<p>Bonjour,</p><p>%s vous invite à rejoindre l\'entreprise <strong>%s</strong> sur la plateforme. '
                . 'Cliquez sur le lien ci-dessous pour créer votre compte. Ce lien expire dans 7 jours.</p>'
                . '<p><a href="%s">Rejoindre l\'entreprise</a></p>'
                . '<p>Si vous n\'attendiez pas cette invitation, ignorez cet email.</p>',
                htmlspecialchars((string) $user->getName(), ENT_QUOTES),
                htmlspecialchars((string) $org->getName(), ENT_QUOTES),
                htmlspecialchars($link, ENT_QUOTES),
            ),
        ]);

        return $this->json(['organization' => $this->serialize($org, $user)], Response::HTTP_CREATED);
    }

    /**
     * Révocation d'une invitation en attente.
     */
    #[Route('/invitations/{id}', name: 'api_organization_revoke_invite', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function revokeInvite(int $id, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        $org = $user->getOrganization();
        if ($org === null) {
            return $this->json(['error' => 'Aucune entreprise.'], Response::HTTP_BAD_REQUEST);
        }
        if (!$this->access->can($user, OrganizationPermissions::CAN_INVITE_USERS)) {
            return $this->json(['error' => 'Vous n\'avez pas le droit de gérer les invitations.'], Response::HTTP_FORBIDDEN);
        }

        $invitation = $this->invitationRepository->find($id);
        if ($invitation === null || $invitation->getOrganization()?->getId() !== $org->getId()) {
            return $this->json(['error' => 'Invitation introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($invitation);
        $this->em->flush();

        return $this->json(['organization' => $this->serialize($org, $user)]);
    }

    /**
     * Résout l'utilisateur + son org en exigeant qu'il en soit propriétaire.
     *
     * @return array{0: ?User, 1: ?Organization, 2: ?JsonResponse}
     */
    private function requireOwner(Request $request): array
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return [null, null, $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED)];
        }
        $org = $user->getOrganization();
        if ($org === null) {
            return [null, null, $this->json(['error' => 'Créez d\'abord une entreprise.'], Response::HTTP_BAD_REQUEST)];
        }
        if (!$org->isOwner($user)) {
            return [null, null, $this->json(['error' => 'Seul le propriétaire peut gérer les membres.'], Response::HTTP_FORBIDDEN)];
        }

        return [$user, $org, null];
    }

    private function findMember(Organization $org, int $userId): ?User
    {
        foreach ($org->getMembers() as $member) {
            if ($member->getId() === $userId) {
                return $member;
            }
        }
        return null;
    }

    private function resolveFrontendBase(Request $request): string
    {
        $origin = $request->headers->get('Origin');
        if (is_string($origin) && preg_match('#^https?://[^/]+$#', $origin) === 1) {
            return rtrim($origin, '/');
        }
        $env = getenv('FRONTEND_URL');

        return is_string($env) && $env !== '' ? rtrim($env, '/') : 'http://localhost:3000';
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
            $isOwner = $org->isOwner($member);
            $members[] = [
                'id' => $member->getId(),
                'name' => $member->getName(),
                'email' => $member->getEmail(),
                'role' => $isOwner ? 'owner' : 'member',
                'permissions' => $isOwner
                    ? OrganizationPermissions::all()
                    : OrganizationPermissions::normalize($member->getOrgPermissions()),
            ];
        }

        $invitations = [];
        if ($org->isOwner($viewer)) {
            foreach ($this->invitationRepository->findPendingForOrganization($org) as $invitation) {
                $invitations[] = [
                    'id' => $invitation->getId(),
                    'email' => $invitation->getEmail(),
                    'permissions' => OrganizationPermissions::normalize($invitation->getPermissions()),
                    'expiresAt' => $invitation->getExpiresAt()?->format('c'),
                ];
            }
        }

        return [
            'id' => $org->getId(),
            'name' => $org->getName(),
            'isOwner' => $org->isOwner($viewer),
            'permissionKeys' => OrganizationPermissions::PERMISSION_KEYS,
            'memberCount' => count($members),
            'members' => $members,
            'invitations' => $invitations,
            'createdAt' => $org->getCreatedAt()?->format('c'),
        ];
    }
}
