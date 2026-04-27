<?php

namespace App\EventListener;

use App\Service\IpBanService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * EventListener qui vérifie les IPs bannies avant chaque requête API
 *
 * Bloque automatiquement les requêtes provenant d'une IP bannie
 *
 * Cet EventListener est automatiquement appelé par Symfony sur l'événement kernel.request
 * grâce à l'implémentation de EventSubscriberInterface et l'autoconfiguration dans services.yaml
 */
class IpBanCheckListener implements EventSubscriberInterface
{
    public function __construct(
        private IpBanService $ipBanService,
    ) {}

    /**
     * Enregistre cet event listener pour l'événement kernel.request
     * Priorité 100 = exécuté très tôt, avant les autres listeners
     */
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 100],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }
        if ($this->ipBanService->isClientBanned($request)) {
            $banInfo = $this->ipBanService->getBanInfo($request);

            $response = new JsonResponse([
                'error' => 'Votre adresse IP est bannie.',
                'reason' => $banInfo?->getReason(),
                'banned_until' => $banInfo?->getBannedUntil()?->format('c'),
            ], Response::HTTP_FORBIDDEN);

            $event->setResponse($response);
        }
    }
}

