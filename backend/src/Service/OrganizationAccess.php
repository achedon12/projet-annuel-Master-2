<?php

namespace App\Service;

use App\Entity\User;

/**
 * Point d'entrée unique pour savoir si un utilisateur a le droit d'effectuer
 * une action. Centralise la règle owner/solo = tous droits, sous-membre =
 * flags. Injecter ce service dans les controllers plutôt que de relire les
 * permissions à la main.
 */
final class OrganizationAccess
{
    /**
     * Vrai si l'utilisateur est un sous-membre (appartient à une organisation
     * qu'il ne possède pas). Un owner ou un compte solo renvoie false.
     */
    public function isSubMember(User $user): bool
    {
        $org = $user->getOrganization();
        if ($org === null) {
            return false;
        }
        return !$org->isOwner($user);
    }

    /**
     * Permissions effectives de l'utilisateur : tous droits pour un
     * owner/solo, sinon le jeu normalisé stocké sur le compte.
     *
     * @return array<string, bool>
     */
    public function permissionsFor(User $user): array
    {
        if (!$this->isSubMember($user)) {
            return OrganizationPermissions::all();
        }
        return OrganizationPermissions::normalize($user->getOrgPermissions());
    }

    /**
     * Autorise l'action `$key` : un owner/solo passe toujours ; un sous-membre
     * doit avoir le flag à true.
     */
    public function can(User $user, string $key): bool
    {
        return $this->permissionsFor($user)[$key] ?? false;
    }
}
