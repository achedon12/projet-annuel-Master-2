<?php

namespace App\Service;

use App\Entity\Integration;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Client Google Calendar v3 + gestion des tokens OAuth.
 *
 * Stratégie tokens :
 *  - access_token (1h) stocké dans Integration::apiKey
 *  - refresh_token (longue durée) stocké dans Integration::refreshToken
 *  - expiration stockée dans Integration::tokenExpiresAt
 *  - getValidAccessToken() refresh transparent quand l'access est expiré ou dans <60s.
 *
 * @see https://developers.google.com/identity/protocols/oauth2/web-server
 * @see https://developers.google.com/calendar/api/v3/reference/events
 */
class GoogleCalendarService
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
    private const REFRESH_SAFETY_MARGIN_SECONDS = 60;

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
        private readonly string $googleClientId,
        private readonly string $googleClientSecret,
    ) {}

    /**
     * Échange un authorization code contre access_token + refresh_token.
     *
     * @return array{access_token:string, refresh_token:?string, expires_in:int, scope:string}
     * @throws \RuntimeException
     */
    public function exchangeCode(string $code, string $redirectUri): array
    {
        $this->assertCredentials();
        try {
            $response = $this->httpClient->request('POST', self::TOKEN_URL, [
                'body' => [
                    'code' => $code,
                    'client_id' => $this->googleClientId,
                    'client_secret' => $this->googleClientSecret,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ],
                'timeout' => 15,
            ]);
            if ($response->getStatusCode() !== 200) {
                $body = $response->getContent(false);
                $this->logger->warning('Échec d\'exchange code Google.', ['status' => $response->getStatusCode(), 'body' => $body]);
                throw new \RuntimeException($this->extractGoogleMessage($body, 'Échec de l\'échange du code OAuth Google.'));
            }
            $data = $response->toArray(false);
            if (!isset($data['access_token']) || !is_string($data['access_token'])) {
                throw new \RuntimeException('Réponse Google sans access_token.');
            }
            return [
                'access_token' => (string) $data['access_token'],
                'refresh_token' => isset($data['refresh_token']) && is_string($data['refresh_token']) ? $data['refresh_token'] : null,
                'expires_in' => isset($data['expires_in']) ? (int) $data['expires_in'] : 3600,
                'scope' => isset($data['scope']) && is_string($data['scope']) ? $data['scope'] : '',
            ];
        } catch (ExceptionInterface | \Throwable $e) {
            $this->logger->error('Exception lors de l\'exchange code Google.', ['exception' => $e->getMessage()]);
            if ($e instanceof \RuntimeException) {
                throw $e;
            }
            throw new \RuntimeException('Impossible de joindre Google : ' . $e->getMessage(), previous: $e);
        }
    }

    /**
     * Renouvelle l'access_token à partir du refresh_token stocké.
     *
     * @return array{access_token:string, expires_in:int}
     * @throws \RuntimeException
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        $this->assertCredentials();
        try {
            $response = $this->httpClient->request('POST', self::TOKEN_URL, [
                'body' => [
                    'client_id' => $this->googleClientId,
                    'client_secret' => $this->googleClientSecret,
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                ],
                'timeout' => 15,
            ]);
            if ($response->getStatusCode() !== 200) {
                $body = $response->getContent(false);
                $this->logger->warning('Échec de refresh token Google.', ['status' => $response->getStatusCode(), 'body' => $body]);
                throw new \RuntimeException('Le refresh_token Google a été révoqué ou est invalide. Reconnectez Calendar.');
            }
            $data = $response->toArray(false);
            if (!isset($data['access_token']) || !is_string($data['access_token'])) {
                throw new \RuntimeException('Réponse Google sans access_token.');
            }
            return [
                'access_token' => (string) $data['access_token'],
                'expires_in' => isset($data['expires_in']) ? (int) $data['expires_in'] : 3600,
            ];
        } catch (ExceptionInterface | \Throwable $e) {
            $this->logger->error('Exception lors du refresh token Google.', ['exception' => $e->getMessage()]);
            if ($e instanceof \RuntimeException) {
                throw $e;
            }
            throw new \RuntimeException('Impossible de joindre Google : ' . $e->getMessage(), previous: $e);
        }
    }

    /**
     * Retourne un access_token valide. Refresh transparent si expiré ou < 60s.
     * Persiste les nouveaux tokens dans Integration.
     *
     * @throws \RuntimeException si pas de refresh_token disponible ou si le refresh échoue
     */
    public function getValidAccessToken(Integration $integration): string
    {
        $accessToken = $integration->getApiKey();
        $expiresAt = $integration->getTokenExpiresAt();
        $refreshToken = $integration->getRefreshToken();

        $now = new \DateTimeImmutable();
        $stillValid = $accessToken !== null && $accessToken !== ''
            && $expiresAt !== null
            && $expiresAt->getTimestamp() - $now->getTimestamp() > self::REFRESH_SAFETY_MARGIN_SECONDS;

        if ($stillValid) {
            return (string) $accessToken;
        }

        if ($refreshToken === null || $refreshToken === '') {
            throw new \RuntimeException('Aucun refresh_token disponible. Reconnectez Calendar dans les paramètres.');
        }

        $refreshed = $this->refreshAccessToken($refreshToken);
        $integration->setApiKey($refreshed['access_token']);
        $integration->setTokenExpiresAt(
            (new \DateTime())->modify('+' . (int) $refreshed['expires_in'] . ' seconds')
        );
        $this->em->flush();

        return $refreshed['access_token'];
    }

    /**
     * Crée un event Calendar et retourne son id.
     *
     * @throws \RuntimeException
     */
    public function createEvent(
        Integration $integration,
        string $summary,
        ?string $description,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
    ): string {
        $accessToken = $this->getValidAccessToken($integration);
        try {
            $response = $this->httpClient->request(
                'POST',
                self::CALENDAR_BASE . '/calendars/primary/events',
                [
                    'headers' => $this->headers($accessToken),
                    'json' => $this->buildEventPayload($summary, $description, $start, $end),
                    'timeout' => 15,
                ],
            );
            if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
                $body = $response->getContent(false);
                $this->logger->warning('Création d\'event Calendar en échec.', ['status' => $response->getStatusCode(), 'body' => $body]);
                throw new \RuntimeException($this->extractGoogleMessage($body, 'Création de l\'event Google Calendar impossible.'));
            }
            $data = $response->toArray(false);
            if (!isset($data['id']) || !is_string($data['id'])) {
                throw new \RuntimeException('Réponse Google sans identifiant d\'event.');
            }
            return (string) $data['id'];
        } catch (ExceptionInterface | \Throwable $e) {
            $this->logger->error('Exception lors de la création d\'event Google.', ['exception' => $e->getMessage()]);
            if ($e instanceof \RuntimeException) {
                throw $e;
            }
            throw new \RuntimeException('Impossible de joindre Google Calendar : ' . $e->getMessage(), previous: $e);
        }
    }

    /**
     * Met à jour un event Calendar existant.
     *
     * @throws \RuntimeException
     */
    public function updateEvent(
        Integration $integration,
        string $eventId,
        string $summary,
        ?string $description,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
    ): void {
        $accessToken = $this->getValidAccessToken($integration);
        try {
            $response = $this->httpClient->request(
                'PATCH',
                self::CALENDAR_BASE . '/calendars/primary/events/' . urlencode($eventId),
                [
                    'headers' => $this->headers($accessToken),
                    'json' => $this->buildEventPayload($summary, $description, $start, $end),
                    'timeout' => 15,
                ],
            );
            if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
                $body = $response->getContent(false);
                $this->logger->warning('Mise à jour d\'event Calendar en échec.', ['status' => $response->getStatusCode(), 'body' => $body]);
                throw new \RuntimeException($this->extractGoogleMessage($body, 'Mise à jour de l\'event Google Calendar impossible.'));
            }
        } catch (ExceptionInterface | \Throwable $e) {
            $this->logger->error('Exception lors de la mise à jour d\'event Google.', ['exception' => $e->getMessage()]);
            if ($e instanceof \RuntimeException) {
                throw $e;
            }
            throw new \RuntimeException('Impossible de joindre Google Calendar : ' . $e->getMessage(), previous: $e);
        }
    }

    /**
     * Supprime un event Calendar. Best-effort, log uniquement en cas d'échec.
     */
    public function deleteEvent(Integration $integration, string $eventId): void
    {
        try {
            $accessToken = $this->getValidAccessToken($integration);
            $this->httpClient->request(
                'DELETE',
                self::CALENDAR_BASE . '/calendars/primary/events/' . urlencode($eventId),
                [
                    'headers' => $this->headers($accessToken),
                    'timeout' => 15,
                ],
            );
        } catch (\Throwable $e) {
            $this->logger->warning('Suppression d\'event Google Calendar en échec.', [
                'eventId' => $eventId,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildEventPayload(
        string $summary,
        ?string $description,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
    ): array {
        return [
            'summary' => mb_substr($summary, 0, 1024),
            'description' => $description !== null ? mb_substr($description, 0, 8192) : null,
            'start' => [
                'dateTime' => $start->format(\DateTimeInterface::RFC3339),
                'timeZone' => 'UTC',
            ],
            'end' => [
                'dateTime' => $end->format(\DateTimeInterface::RFC3339),
                'timeZone' => 'UTC',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $accessToken): array
    {
        return [
            'Authorization' => 'Bearer ' . $accessToken,
            'Content-Type' => 'application/json',
        ];
    }

    private function extractGoogleMessage(string $body, string $fallback): string
    {
        $data = json_decode($body, true);
        if (is_array($data)) {
            if (isset($data['error_description']) && is_string($data['error_description'])) {
                return $data['error_description'];
            }
            if (isset($data['error']['message']) && is_string($data['error']['message'])) {
                return $data['error']['message'];
            }
            if (isset($data['error']) && is_string($data['error'])) {
                return $data['error'];
            }
        }
        return $fallback;
    }

    private function assertCredentials(): void
    {
        if ($this->googleClientId === '' || $this->googleClientSecret === '') {
            throw new \RuntimeException('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET non configurés.');
        }
    }
}
