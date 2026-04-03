<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class ApiController extends AbstractController
{
    #[Route('/api/ping', name: 'api_ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return $this->json(['status' => 'ok', 'message' => 'pong']);
    }
}
