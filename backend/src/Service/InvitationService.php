<?php

namespace App\Service;

use App\Entity\Invitation;
use App\Entity\Organization;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Création et validation des jetons d'invitation. Le jeton en clair (32 octets
 * hex) n'est jamais stocké : seul son SHA-256 est persisté, comme pour le
 * magic link. Le clair n'existe que le temps de construire le lien d'email.
 */
final class InvitationService
{
    private const TOKEN_BYTES = 32;
    private const TTL_DAYS = 7;

    public function __construct(private readonly EntityManagerInterface $em) {}

    public function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Crée (et persiste) une invitation, renvoie le jeton en clair à mettre
     * dans le lien.
     *
     * @param array<string, bool> $permissions
     * @return array{invitation: Invitation, token: string}
     */
    public function issue(Organization $organization, User $invitedBy, string $email, array $permissions): array
    {
        $token = bin2hex(random_bytes(self::TOKEN_BYTES));

        $invitation = new Invitation();
        $invitation->setOrganization($organization);
        $invitation->setInvitedBy($invitedBy);
        $invitation->setEmail($email);
        $invitation->setPermissions($permissions);
        $invitation->setTokenHash($this->hash($token));
        $invitation->setExpiresAt(new \DateTime('+' . self::TTL_DAYS . ' days'));

        $this->em->persist($invitation);
        $this->em->flush();

        return ['invitation' => $invitation, 'token' => $token];
    }

    /**
     * Renouvelle le jeton d'une invitation existante (renvoie le nouveau clair).
     */
    public function rotate(Invitation $invitation): string
    {
        $token = bin2hex(random_bytes(self::TOKEN_BYTES));
        $invitation->setTokenHash($this->hash($token));
        $invitation->setExpiresAt(new \DateTime('+' . self::TTL_DAYS . ' days'));
        $this->em->flush();

        return $token;
    }
}
