<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Client minimaliste pour l'API Notion.
 *
 * Stratégie : on accepte un Internal Integration Token fourni par l'utilisateur
 * (créé manuellement sur notion.so/my-integrations). Pas d'OAuth.
 *
 * Notion oblige à partager explicitement chaque page parente avec l'intégration ;
 * sinon les requêtes retournent 404. C'est de la responsabilité de l'utilisateur.
 */
class NotionService
{
    private const BASE_URL = 'https://api.notion.com/v1';
    private const NOTION_VERSION = '2022-06-28';
    private const MAX_BLOCKS_PER_REQUEST = 100;

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Vérifie que le token est valide en pingant GET /v1/users/me.
     */
    public function validateToken(string $token): bool
    {
        try {
            $response = $this->httpClient->request('GET', self::BASE_URL . '/users/me', [
                'headers' => $this->headers($token),
                'timeout' => 10,
            ]);
            return $response->getStatusCode() === 200;
        } catch (ExceptionInterface | TransportException $e) {
            $this->logger->warning('Échec de validation du token Notion.', ['exception' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Crée une nouvelle page Notion enfant de parentPageId.
     *
     * @return string l'identifiant Notion de la page créée (sans dashes)
     * @throws \RuntimeException si l'appel Notion échoue
     */
    public function createPage(string $token, string $parentPageId, string $title, string $contentMarkdown): string
    {
        $blocks = $this->markdownToBlocks($contentMarkdown);

        $payload = [
            'parent' => ['type' => 'page_id', 'page_id' => $this->normalizePageId($parentPageId)],
            'properties' => [
                'title' => [['type' => 'text', 'text' => ['content' => $this->truncateForNotion($title)]]],
            ],
            'children' => array_slice($blocks, 0, self::MAX_BLOCKS_PER_REQUEST),
        ];

        try {
            $response = $this->httpClient->request('POST', self::BASE_URL . '/pages', [
                'headers' => $this->headers($token),
                'json' => $payload,
                'timeout' => 30,
            ]);
            $status = $response->getStatusCode();
            if ($status < 200 || $status >= 300) {
                $body = $response->getContent(false);
                $this->logger->warning('Création de page Notion en échec.', ['status' => $status, 'body' => $body]);
                throw new \RuntimeException($this->extractNotionMessage($body, 'Création de page Notion impossible.'));
            }
            $data = $response->toArray(false);
            $pageId = isset($data['id']) ? str_replace('-', '', (string) $data['id']) : '';
            if ($pageId === '') {
                throw new \RuntimeException('Réponse Notion sans identifiant de page.');
            }

            // Ajouter les blocs restants si on a dépassé 100.
            if (count($blocks) > self::MAX_BLOCKS_PER_REQUEST) {
                $remaining = array_slice($blocks, self::MAX_BLOCKS_PER_REQUEST);
                $this->appendBlocks($token, $pageId, $remaining);
            }

            return $pageId;
        } catch (ExceptionInterface | TransportException $e) {
            $this->logger->error('Erreur de transport vers Notion (createPage).', ['exception' => $e->getMessage()]);
            throw new \RuntimeException('Impossible de joindre Notion : ' . $e->getMessage(), previous: $e);
        }
    }

    /**
     * Met à jour le titre et le contenu d'une page Notion existante.
     * On vide tous les blocs enfants existants puis on re-append.
     *
     * @throws \RuntimeException si l'appel Notion échoue
     */
    public function updatePage(string $token, string $pageId, string $title, string $contentMarkdown): void
    {
        $pageId = $this->normalizePageId($pageId);

        // 1. Update du titre.
        try {
            $titleResponse = $this->httpClient->request('PATCH', self::BASE_URL . '/pages/' . $pageId, [
                'headers' => $this->headers($token),
                'json' => [
                    'properties' => [
                        'title' => [['type' => 'text', 'text' => ['content' => $this->truncateForNotion($title)]]],
                    ],
                ],
                'timeout' => 30,
            ]);
            $status = $titleResponse->getStatusCode();
            if ($status < 200 || $status >= 300) {
                $body = $titleResponse->getContent(false);
                $this->logger->warning('Mise à jour du titre Notion en échec.', ['status' => $status, 'body' => $body]);
                throw new \RuntimeException($this->extractNotionMessage($body, 'Mise à jour du titre Notion impossible.'));
            }
        } catch (ExceptionInterface | TransportException $e) {
            $this->logger->error('Erreur de transport vers Notion (updatePage title).', ['exception' => $e->getMessage()]);
            throw new \RuntimeException('Impossible de joindre Notion : ' . $e->getMessage(), previous: $e);
        }

        // 2. Lister puis supprimer les blocs enfants existants.
        $childIds = $this->listChildBlockIds($token, $pageId);
        foreach ($childIds as $childId) {
            $this->deleteBlock($token, $childId);
        }

        // 3. Append les nouveaux blocs.
        $blocks = $this->markdownToBlocks($contentMarkdown);
        if (count($blocks) > 0) {
            $this->appendBlocks($token, $pageId, $blocks);
        }
    }

    /**
     * Convertit un markdown simple en blocs Notion.
     *
     * Gère : H1/H2/H3 (`#`/`##`/`###`), listes à puces (`-` ou `*`), paragraphes.
     * Les lignes vides séparent les blocs.
     *
     * @return list<array<string, mixed>>
     */
    private function markdownToBlocks(string $markdown): array
    {
        $markdown = trim($markdown);
        if ($markdown === '') {
            return [];
        }

        $lines = preg_split("/\r\n|\n|\r/", $markdown);
        $blocks = [];
        $buffer = [];

        $flushParagraph = function () use (&$buffer, &$blocks): void {
            if (count($buffer) === 0) {
                return;
            }
            $text = implode("\n", $buffer);
            $buffer = [];
            $blocks[] = $this->paragraphBlock($text);
        };

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                $flushParagraph();
                continue;
            }

            if (preg_match('/^(#{1,3})\s+(.+)$/', $trimmed, $matches) === 1) {
                $flushParagraph();
                $level = strlen($matches[1]);
                $blocks[] = $this->headingBlock($level, $matches[2]);
                continue;
            }

            if (preg_match('/^[-*]\s+(.+)$/', $trimmed, $matches) === 1) {
                $flushParagraph();
                $blocks[] = $this->bulletBlock($matches[1]);
                continue;
            }

            $buffer[] = $trimmed;
        }
        $flushParagraph();

        return $blocks;
    }

    /**
     * @return array<string, mixed>
     */
    private function paragraphBlock(string $text): array
    {
        return [
            'object' => 'block',
            'type' => 'paragraph',
            'paragraph' => ['rich_text' => $this->richText($text)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function headingBlock(int $level, string $text): array
    {
        $type = 'heading_' . max(1, min(3, $level));
        return [
            'object' => 'block',
            'type' => $type,
            $type => ['rich_text' => $this->richText($text)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bulletBlock(string $text): array
    {
        return [
            'object' => 'block',
            'type' => 'bulleted_list_item',
            'bulleted_list_item' => ['rich_text' => $this->richText($text)],
        ];
    }

    /**
     * Notion limite chaque rich_text content à 2000 caractères.
     *
     * @return list<array<string, mixed>>
     */
    private function richText(string $text): array
    {
        $chunks = mb_str_split($text, 2000);
        return array_map(
            fn(string $chunk) => ['type' => 'text', 'text' => ['content' => $chunk]],
            $chunks,
        );
    }

    /**
     * Liste tous les block_id enfants d'une page (pagine si besoin).
     *
     * @return list<string>
     */
    private function listChildBlockIds(string $token, string $pageId): array
    {
        $ids = [];
        $cursor = null;

        try {
            do {
                $url = self::BASE_URL . '/blocks/' . $pageId . '/children?page_size=100';
                if ($cursor !== null) {
                    $url .= '&start_cursor=' . urlencode($cursor);
                }
                $response = $this->httpClient->request('GET', $url, [
                    'headers' => $this->headers($token),
                    'timeout' => 15,
                ]);
                if ($response->getStatusCode() >= 300) {
                    break;
                }
                $data = $response->toArray(false);
                foreach (($data['results'] ?? []) as $block) {
                    if (isset($block['id'])) {
                        $ids[] = (string) $block['id'];
                    }
                }
                $cursor = $data['has_more'] ?? false ? ($data['next_cursor'] ?? null) : null;
            } while ($cursor !== null);
        } catch (ExceptionInterface | TransportException $e) {
            $this->logger->warning('Listing des blocs Notion en échec.', ['exception' => $e->getMessage()]);
        }

        return $ids;
    }

    private function deleteBlock(string $token, string $blockId): void
    {
        try {
            $this->httpClient->request('DELETE', self::BASE_URL . '/blocks/' . $blockId, [
                'headers' => $this->headers($token),
                'timeout' => 15,
            ]);
        } catch (ExceptionInterface | TransportException $e) {
            $this->logger->warning('Suppression de bloc Notion en échec.', [
                'blockId' => $blockId,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param list<array<string, mixed>> $blocks
     */
    private function appendBlocks(string $token, string $pageId, array $blocks): void
    {
        foreach (array_chunk($blocks, self::MAX_BLOCKS_PER_REQUEST) as $chunk) {
            try {
                $response = $this->httpClient->request(
                    'PATCH',
                    self::BASE_URL . '/blocks/' . $pageId . '/children',
                    [
                        'headers' => $this->headers($token),
                        'json' => ['children' => $chunk],
                        'timeout' => 30,
                    ],
                );
                $status = $response->getStatusCode();
                if ($status < 200 || $status >= 300) {
                    $body = $response->getContent(false);
                    $this->logger->warning('Append de blocs Notion en échec.', ['status' => $status, 'body' => $body]);
                    throw new \RuntimeException($this->extractNotionMessage($body, 'Ajout de blocs Notion impossible.'));
                }
            } catch (ExceptionInterface | TransportException $e) {
                $this->logger->error('Erreur de transport vers Notion (appendBlocks).', ['exception' => $e->getMessage()]);
                throw new \RuntimeException('Impossible de joindre Notion : ' . $e->getMessage(), previous: $e);
            }
        }
    }

    /**
     * Notion accepte les IDs avec ou sans dashes. On normalise sans dashes.
     */
    private function normalizePageId(string $rawId): string
    {
        $clean = trim($rawId);
        // Si l'user a collé une URL Notion (https://notion.so/Title-xxxxxxxxx32hex), extraire les 32 hex finaux.
        if (preg_match('/([0-9a-fA-F]{32})/', $clean, $matches) === 1) {
            return strtolower($matches[1]);
        }
        return strtolower(str_replace('-', '', $clean));
    }

    /**
     * Notion limite chaque title à 2000 caractères ; on tronque proprement.
     */
    private function truncateForNotion(string $value): string
    {
        return mb_substr($value, 0, 2000);
    }

    /**
     * Extrait un message lisible depuis une réponse d'erreur Notion JSON.
     */
    private function extractNotionMessage(string $body, string $fallback): string
    {
        $data = json_decode($body, true);
        if (is_array($data) && isset($data['message']) && is_string($data['message'])) {
            return $data['message'];
        }
        return $fallback;
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $token): array
    {
        return [
            'Authorization' => 'Bearer ' . $token,
            'Notion-Version' => self::NOTION_VERSION,
            'Content-Type' => 'application/json',
        ];
    }
}
