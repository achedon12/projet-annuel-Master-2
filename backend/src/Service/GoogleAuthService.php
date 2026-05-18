<?php

namespace App\Service;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Vérifie un id_token Google en validant sa signature contre les clés
 * publiques de Google (JWKS) et en contrôlant aud/iss/exp.
 *
 * @see https://developers.google.com/identity/sign-in/web/backend-auth
 */
class GoogleAuthService
{
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
    private const ALLOWED_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
    private const CACHE_KEY = 'google_jwks_v3';
    private const CACHE_TTL = 3600; // 1h

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly CacheInterface $cache,
        private readonly string $googleClientId,
    ) {}

    /**
     * Vérifie l'id_token et retourne le payload décodé.
     *
     * @throws \RuntimeException si le token est invalide pour quelque raison que ce soit
     * @return array{sub:string, email:string, email_verified?:bool, name?:string, picture?:string, iss:string, aud:string, exp:int}
     */
    public function verifyIdToken(string $idToken): array
    {
        if ($this->googleClientId === '') {
            throw new \RuntimeException('GOOGLE_CLIENT_ID non configuré côté backend.');
        }

        $keys = $this->fetchJwks();

        try {
            $decoded = JWT::decode($idToken, $keys);
        } catch (\Throwable $e) {
            $this->logger->warning('Échec de décodage de l\'id_token Google.', ['exception' => $e->getMessage()]);
            throw new \RuntimeException('id_token Google invalide.', previous: $e);
        }

        $payload = (array) $decoded;

        if (!isset($payload['iss']) || !in_array($payload['iss'], self::ALLOWED_ISSUERS, true)) {
            throw new \RuntimeException('Émetteur (iss) de l\'id_token Google invalide.');
        }
        if (!isset($payload['aud']) || $payload['aud'] !== $this->googleClientId) {
            throw new \RuntimeException('Audience (aud) de l\'id_token Google invalide.');
        }
        if (!isset($payload['email']) || !is_string($payload['email']) || trim($payload['email']) === '') {
            throw new \RuntimeException('Email absent de l\'id_token Google.');
        }
        // Fail-closed : un id_token sans `email_verified === true` est rejeté.
        // Défense en profondeur contre un futur payload Google qui ometterait
        // le claim ou un IDP malveillant qui le mettrait à false.
        if (!isset($payload['email_verified']) || $payload['email_verified'] !== true) {
            throw new \RuntimeException('Email Google non vérifié.');
        }

        return $payload;
    }

    /**
     * Récupère les JWKS Google (cache 1h du JSON brut, parse en mémoire à
     * chaque verify : on ne peut pas cacher les objets Key parsés car ils
     * contiennent des ressources OpenSSL non sérialisables).
     *
     * @return array<string, \Firebase\JWT\Key>
     */
    private function fetchJwks(): array
    {
        $rawJson = $this->cache->get(self::CACHE_KEY, function (ItemInterface $item): string {
            $item->expiresAfter(self::CACHE_TTL);
            try {
                $response = $this->httpClient->request('GET', self::JWKS_URL, ['timeout' => 10]);
                $body = $response->getContent(false);
                $data = json_decode($body, true);
                if (!is_array($data) || !isset($data['keys']) || !is_array($data['keys'])) {
                    throw new \RuntimeException('JWKS Google sans champ "keys".');
                }
                return $body;
            } catch (ExceptionInterface | \Throwable $e) {
                $this->logger->error('Échec de récupération du JWKS Google.', ['exception' => $e->getMessage()]);
                throw new \RuntimeException('Impossible de récupérer les clés publiques Google.', previous: $e);
            }
        });

        $data = json_decode($rawJson, true);
        if (!is_array($data)) {
            throw new \RuntimeException('JWKS Google en cache illisible.');
        }
        return JWK::parseKeySet($data);
    }
}
