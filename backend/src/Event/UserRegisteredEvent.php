<?php

namespace App\Event;

use App\Entity\User;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Événement déclenché lors de l'inscription d'un nouvel utilisateur
 */
class UserRegisteredEvent extends Event
{
    public const NAME = 'user.registered';

    public function __construct(
        private User $user,
    ) {}

    public function getUser(): User
    {
        return $this->user;
    }
}
