<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpClientExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Génère des idées d'articles SEO via l'API Mistral (chat completions).
 *
 * Le service compose un prompt système + utilisateur en fonction du mot-clé,
 * du type de contenu et de l'audience saisis, puis demande à Mistral de
 * renvoyer un objet JSON strict { ideas: [...] }.
 */
class MistralIdeaGeneratorService
{
    public const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

    private const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'advanced'];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly string $apiKey,
        private readonly string $model,
    ) {}

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Génère une liste d'idées via Mistral.
     *
     * @return array<int, array{title:string, description:string, keywords:array<int,string>, difficulty:string, volume:string}>
     *
     * @throws MistralGenerationException si l'appel ou le parsing échoue
     */
    public function generate(
        string $keyword,
        ?string $contentType,
        ?string $audience,
        string $locale,
    ): array {
        if (!$this->isConfigured()) {
            throw new MistralGenerationException('Le service de génération n\'est pas configuré.', 503);
        }

        $payload = [
            'model' => $this->model,
            'temperature' => 0.7,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSystemPrompt($locale)],
                ['role' => 'user', 'content' => $this->buildUserPrompt($keyword, $contentType, $audience, $locale)],
            ],
        ];

        try {
            $response = $this->httpClient->request('POST', self::ENDPOINT, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'json' => $payload,
                'timeout' => 30,
            ]);

            $status = $response->getStatusCode();
            if ($status >= 400) {
                $this->logger->warning('Mistral a renvoyé un statut HTTP non OK.', [
                    'status' => $status,
                    'body' => substr($response->getContent(false), 0, 500),
                ]);
                throw new MistralGenerationException('La génération a échoué côté fournisseur.', 502);
            }

            $data = $response->toArray(false);
        } catch (HttpClientExceptionInterface $e) {
            $this->logger->error('Erreur HTTP lors de l\'appel à Mistral.', ['exception' => $e->getMessage()]);
            throw new MistralGenerationException('Service de génération injoignable.', 502, $e);
        }

        $content = $data['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || $content === '') {
            throw new MistralGenerationException('Réponse Mistral vide.', 502);
        }

        $decoded = json_decode($content, true);
        if (!is_array($decoded) || !isset($decoded['ideas']) || !is_array($decoded['ideas'])) {
            $this->logger->warning('Réponse Mistral non parsable.', ['content' => substr($content, 0, 500)]);
            throw new MistralGenerationException('Réponse Mistral invalide.', 502);
        }

        $ideas = [];
        foreach ($decoded['ideas'] as $raw) {
            $normalized = $this->normalizeIdea($raw);
            if ($normalized !== null) {
                $ideas[] = $normalized;
            }
        }

        if ($ideas === []) {
            throw new MistralGenerationException('Aucune idée exploitable retournée.', 502);
        }

        return $ideas;
    }

    private function buildSystemPrompt(string $locale): string
    {
        if ($locale === 'en') {
            return <<<PROMPT
You are an SEO strategist. Generate practical, original content ideas tailored to the user request.
Reply with a STRICT JSON object matching exactly:
{"ideas":[{"title":string,"description":string,"keywords":[string,...],"difficulty":"easy"|"medium"|"advanced","volume":string}]}
- "ideas" must contain between 4 and 6 items.
- "description" must be 1 to 2 sentences.
- "keywords" must contain between 2 and 5 short SEO keywords (no hashtags).
- "volume" must be an estimated monthly search volume like "2.4K" or "850".
Do not wrap the JSON in backticks. Do not add any text outside the JSON.
PROMPT;
        }

        return <<<PROMPT
Tu es un stratège SEO. Génère des idées de contenu pratiques et originales adaptées à la demande.
Réponds avec un objet JSON STRICT correspondant exactement à :
{"ideas":[{"title":string,"description":string,"keywords":[string,...],"difficulty":"easy"|"medium"|"advanced","volume":string}]}
- "ideas" doit contenir entre 4 et 6 éléments.
- "description" doit faire 1 à 2 phrases.
- "keywords" doit contenir entre 2 et 5 mots-clés SEO courts (pas de hashtags).
- "volume" doit être une estimation de volume de recherche mensuel comme "2.4K" ou "850".
N'encadre pas le JSON avec des backticks. N'ajoute aucun texte en dehors du JSON.
PROMPT;
    }

    private function buildUserPrompt(string $keyword, ?string $contentType, ?string $audience, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        $lines[] = $isEn ? 'Main keyword: ' . $keyword : 'Mot-clé principal : ' . $keyword;
        if ($contentType !== null && $contentType !== '') {
            $lines[] = $isEn ? 'Preferred content type: ' . $contentType : 'Type de contenu préféré : ' . $contentType;
        }
        if ($audience !== null && $audience !== '') {
            $lines[] = $isEn ? 'Target audience: ' . $audience : 'Audience cible : ' . $audience;
        }
        $lines[] = $isEn
            ? 'Language for the generated titles and descriptions: English.'
            : 'Langue des titres et descriptions générés : français.';

        return implode("\n", $lines);
    }

    /**
     * @param mixed $raw
     * @return array{title:string, description:string, keywords:array<int,string>, difficulty:string, volume:string}|null
     */
    private function normalizeIdea(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }

        $title = isset($raw['title']) && is_string($raw['title']) ? trim($raw['title']) : '';
        $description = isset($raw['description']) && is_string($raw['description']) ? trim($raw['description']) : '';
        if ($title === '' || $description === '') {
            return null;
        }

        $keywords = [];
        if (isset($raw['keywords']) && is_array($raw['keywords'])) {
            foreach ($raw['keywords'] as $kw) {
                if (is_string($kw)) {
                    $trimmed = trim($kw);
                    if ($trimmed !== '') {
                        $keywords[] = $trimmed;
                    }
                }
            }
        }

        $difficulty = isset($raw['difficulty']) && is_string($raw['difficulty'])
            ? strtolower(trim($raw['difficulty']))
            : 'medium';
        if (!in_array($difficulty, self::ALLOWED_DIFFICULTIES, true)) {
            $difficulty = 'medium';
        }

        $volume = isset($raw['volume']) && is_string($raw['volume']) ? trim($raw['volume']) : '';
        if ($volume === '') {
            $volume = '—';
        }

        return [
            'title' => mb_substr($title, 0, 250),
            'description' => mb_substr($description, 0, 600),
            'keywords' => array_slice($keywords, 0, 5),
            'difficulty' => $difficulty,
            'volume' => mb_substr($volume, 0, 20),
        ];
    }
}
