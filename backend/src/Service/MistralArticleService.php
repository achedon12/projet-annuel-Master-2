<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface as HttpClientExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Génère ou reformule du contenu d'article SEO via l'API Mistral (chat completions).
 *
 * Contrairement à MistralIdeaGeneratorService qui demande du JSON structuré,
 * ce service demande du texte libre en Markdown.
 */
class MistralArticleService
{
    private const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
    private const TEMPERATURE = 0.6;
    private const TIMEOUT_SECONDS = 60;
    private const MAX_TARGET_WORDS = 5000;

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
     * Génère un article complet en Markdown.
     *
     * @throws MistralGenerationException
     */
    public function generateContent(
        string $title,
        ?string $tone,
        ?string $audience,
        int $targetWords,
        string $locale,
    ): string {
        $this->assertConfigured();
        $targetWords = max(100, min(self::MAX_TARGET_WORDS, $targetWords));

        return $this->callMistral(
            $this->buildContentSystemPrompt($locale),
            $this->buildContentUserPrompt($title, $tone, $audience, $targetWords, $locale),
        );
    }

    /**
     * Reformule un paragraphe en conservant le sens et le ton.
     *
     * @throws MistralGenerationException
     */
    public function rewriteParagraph(
        string $paragraph,
        ?string $tone,
        string $locale,
    ): string {
        $this->assertConfigured();

        return $this->callMistral(
            $this->buildRewriteSystemPrompt($locale),
            $this->buildRewriteUserPrompt($paragraph, $tone, $locale),
        );
    }

    private function assertConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new MistralGenerationException('Le service de génération n\'est pas configuré.', 503);
        }
    }

    private function callMistral(string $systemPrompt, string $userPrompt): string
    {
        $payload = [
            'model' => $this->model,
            'temperature' => self::TEMPERATURE,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
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
                'timeout' => self::TIMEOUT_SECONDS,
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
        if (!is_string($content) || trim($content) === '') {
            throw new MistralGenerationException('Réponse Mistral vide.', 502);
        }

        return trim($content);
    }

    private function buildContentSystemPrompt(string $locale): string
    {
        if ($locale === 'en') {
            return <<<PROMPT
You are an experienced SEO content writer. Produce a full article in Markdown,
respecting the user's target word count, tone, and target audience.
Structure: H1 title, an introduction, several H2/H3 sections, and a short conclusion.
Use natural keyword placement. Output ONLY the Markdown body — no preamble, no code fences.
PROMPT;
        }

        return <<<PROMPT
Tu es un rédacteur SEO expérimenté. Produis un article complet en Markdown,
en respectant le nombre de mots cible, le ton et l'audience demandés.
Structure : titre H1, introduction, plusieurs sections H2/H3, courte conclusion.
Place les mots-clés naturellement. Renvoie UNIQUEMENT le corps Markdown — pas de préambule, pas de bloc de code.
PROMPT;
    }

    private function buildContentUserPrompt(string $title, ?string $tone, ?string $audience, int $targetWords, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        $lines[] = $isEn ? 'Article title: ' . $title : 'Titre de l\'article : ' . $title;
        $lines[] = $isEn ? 'Target word count: approximately ' . $targetWords : 'Nombre de mots cible : environ ' . $targetWords;
        if ($tone !== null && $tone !== '') {
            $lines[] = $isEn ? 'Tone: ' . $tone : 'Ton : ' . $tone;
        }
        if ($audience !== null && $audience !== '') {
            $lines[] = $isEn ? 'Target audience: ' . $audience : 'Audience cible : ' . $audience;
        }
        $lines[] = $isEn ? 'Output language: English.' : 'Langue de sortie : français.';

        return implode("\n", $lines);
    }

    private function buildRewriteSystemPrompt(string $locale): string
    {
        if ($locale === 'en') {
            return <<<PROMPT
You are a copy editor. Rewrite the user paragraph while keeping the original meaning,
length (±20%), and structure. Preserve any Markdown formatting. Output ONLY the rewritten paragraph.
PROMPT;
        }

        return <<<PROMPT
Tu es un correcteur éditorial. Reformule le paragraphe de l'utilisateur en conservant
le sens d'origine, la longueur (±20%) et la structure. Préserve le formatage Markdown s'il y en a.
Renvoie UNIQUEMENT le paragraphe reformulé.
PROMPT;
    }

    private function buildRewriteUserPrompt(string $paragraph, ?string $tone, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        if ($tone !== null && $tone !== '') {
            $lines[] = $isEn ? 'Preferred tone: ' . $tone : 'Ton préféré : ' . $tone;
        }
        $lines[] = $isEn ? 'Paragraph to rewrite:' : 'Paragraphe à reformuler :';
        $lines[] = $paragraph;

        return implode("\n", $lines);
    }
}
