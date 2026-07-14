<?php

namespace App\Service;

/**
 * Définition et normalisation des permissions d'un membre d'entreprise.
 *
 * Convention (inspirée du modèle sous-comptes de callCenterRate) :
 *   - le propriétaire (owner) d'une organisation a TOUS les droits,
 *     indépendamment du jeu stocké : on ne stocke pas ses permissions ;
 *   - un utilisateur sans organisation (compte solo) a tous les droits
 *     sur son propre espace ;
 *   - un sous-membre porte un tableau de flags booléens (un par clé de
 *     PERMISSION_KEYS). Une clé absente ou non-booléenne vaut « refusé ».
 *
 * Le contenu reste par utilisateur : ces permissions débloquent des
 * FONCTIONNALITÉS (générer, exporter, Notion, planifier, inviter), elles
 * ne partagent pas les articles entre membres.
 */
final class OrganizationPermissions
{
    public const CAN_GENERATE_ARTICLES = 'canGenerateArticles';
    public const CAN_EDIT_ARTICLES = 'canEditArticles';
    public const CAN_DELETE_ARTICLES = 'canDeleteArticles';
    public const CAN_EXPORT = 'canExport';
    public const CAN_MANAGE_NOTION = 'canManageNotion';
    public const CAN_SCHEDULE = 'canSchedule';
    public const CAN_INVITE_USERS = 'canInviteUsers';

    /** @var list<string> */
    public const PERMISSION_KEYS = [
        self::CAN_GENERATE_ARTICLES,
        self::CAN_EDIT_ARTICLES,
        self::CAN_DELETE_ARTICLES,
        self::CAN_EXPORT,
        self::CAN_MANAGE_NOTION,
        self::CAN_SCHEDULE,
        self::CAN_INVITE_USERS,
    ];

    /**
     * Droits par défaut d'un nouveau sous-membre : il peut travailler ses
     * propres articles et les exporter, mais ne peut ni supprimer, ni gérer
     * Notion/la planification, ni inviter d'autres membres.
     *
     * @var array<string, bool>
     */
    public const DEFAULT_MEMBER = [
        self::CAN_GENERATE_ARTICLES => true,
        self::CAN_EDIT_ARTICLES => true,
        self::CAN_DELETE_ARTICLES => false,
        self::CAN_EXPORT => true,
        self::CAN_MANAGE_NOTION => false,
        self::CAN_SCHEDULE => false,
        self::CAN_INVITE_USERS => false,
    ];

    /**
     * Ramène une entrée arbitraire à un jeu complet et sûr : toutes les clés
     * connues présentes en booléen, les clés inconnues ignorées.
     *
     * @param mixed $raw
     * @return array<string, bool>
     */
    public static function normalize(mixed $raw): array
    {
        $out = self::DEFAULT_MEMBER;
        if (!is_array($raw)) {
            return $out;
        }
        foreach (self::PERMISSION_KEYS as $key) {
            if (array_key_exists($key, $raw)) {
                $out[$key] = (bool) $raw[$key];
            }
        }
        return $out;
    }

    /** Tous les droits (utilisé pour owner / compte solo). @return array<string, bool> */
    public static function all(): array
    {
        return array_fill_keys(self::PERMISSION_KEYS, true);
    }
}
