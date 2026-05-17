<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserLoginIp;
use App\Repository\UserLoginIpRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

/**
 * Enregistre les IP utilisées pour se connecter par un utilisateur.
 * Si l'IP existe déjà pour cet utilisateur, on met à jour `lastSeenAt`.
 */
class UserLoginIpRecorder
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserLoginIpRepository $repository,
        private IpBanService $ipBanService,
    ) {}

    public function record(User $user, Request $request, string $event = 'login'): UserLoginIp
    {
        $ip = $this->ipBanService->getClientIp($request);
        $userAgent = $request->headers->get('User-Agent');
        if ($userAgent !== null && strlen($userAgent) > 1000) {
            $userAgent = substr($userAgent, 0, 1000);
        }

        $existing = $this->repository->findOneByUserAndIp($user, $ip);
        $now = new \DateTime();

        if ($existing) {
            $existing->setLastSeenAt($now);
            if ($userAgent !== null) {
                $existing->setUserAgent($userAgent);
            }
            $existing->setEvent($event);
            $this->em->flush();
            return $existing;
        }

        $record = new UserLoginIp();
        $record->setUser($user);
        $record->setIpAddress($ip);
        $record->setUserAgent($userAgent);
        $record->setEvent($event);
        $record->setCreatedAt($now);
        $record->setLastSeenAt($now);

        $this->em->persist($record);
        $this->em->flush();

        return $record;
    }
}
