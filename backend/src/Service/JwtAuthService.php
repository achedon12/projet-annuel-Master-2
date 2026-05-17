<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\HttpFoundation\Request;

/**
 * Décode un JWT depuis l'en-tête Authorization: Bearer <token>
 * et résout l'utilisateur correspondant.
 */
class JwtAuthService
{
    private string $jwtAlgorithm = 'HS256';

    public function __construct(
        private UserRepository $userRepository,
    ) {}

    public function getSecret(): string
    {
        $env = getenv('JWT_SECRET');
        return $env !== false && $env !== ''
            ? $env
            : 'your_super_secret_jwt_key_change_this_in_production_12345';
    }

    public function extractBearerToken(Request $request): ?string
    {
        $header = $request->headers->get('Authorization');
        if (!$header) {
            return null;
        }
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }
        return trim(substr($header, 7)) ?: null;
    }

    /**
     * @return array<string,mixed>|null
     */
    public function decode(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->getSecret(), $this->jwtAlgorithm));
            return (array) $decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function authenticate(Request $request): ?User
    {
        $token = $this->extractBearerToken($request);
        if (!$token) {
            return null;
        }

        $payload = $this->decode($token);
        if (!$payload || !isset($payload['userId'])) {
            return null;
        }

        return $this->userRepository->find($payload['userId']);
    }
}
