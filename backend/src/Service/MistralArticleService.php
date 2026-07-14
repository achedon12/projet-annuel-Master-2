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
        int $minWords,
        int $maxWords,
        string $locale,
    ): string {
        $this->assertConfigured();
        $minWords = max(100, min(self::MAX_TARGET_WORDS, $minWords));
        $maxWords = max($minWords, min(self::MAX_TARGET_WORDS, $maxWords));

        return $this->callMistral(
            $this->buildContentSystemPrompt($locale),
            $this->buildContentUserPrompt($title, $tone, $audience, $minWords, $maxWords, $locale),
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

    /**
     * Applique une action ciblée sur le contenu de l'article (style, intro, SEO).
     *
     * @param 'improve-style'|'add-intro'|'optimize-seo' $action
     *
     * @throws MistralGenerationException
     */
    public function applyAction(
        string $action,
        string $title,
        string $content,
        ?string $tone,
        ?string $audience,
        string $locale,
    ): string {
        $this->assertConfigured();

        $system = $this->buildActionSystemPrompt($action, $locale);
        $user = $this->buildActionUserPrompt($title, $content, $tone, $audience, $locale);

        return $this->callMistral($system, $user);
    }

    /**
     * Génère 3 suggestions d'amélioration concrètes à partir du titre et du contenu.
     *
     * @return array<int, string>
     *
     * @throws MistralGenerationException
     */
    public function generateSuggestions(string $title, string $content, string $locale): array
    {
        $this->assertConfigured();

        $raw = $this->callMistral(
            $this->buildSuggestionsSystemPrompt($locale),
            $this->buildSuggestionsUserPrompt($title, $content, $locale),
            jsonObject: true,
        );

        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || !isset($decoded['suggestions']) || !is_array($decoded['suggestions'])) {
            $this->logger->warning('Réponse suggestions Mistral non parsable.', ['raw' => substr($raw, 0, 300)]);
            throw new MistralGenerationException('Réponse Mistral invalide.', 502);
        }

        $suggestions = [];
        foreach ($decoded['suggestions'] as $item) {
            if (is_string($item)) {
                $trimmed = trim($item);
                if ($trimmed !== '') {
                    $suggestions[] = mb_substr($trimmed, 0, 280);
                }
            }
        }

        if ($suggestions === []) {
            throw new MistralGenerationException('Aucune suggestion exploitable retournée.', 502);
        }

        return array_slice($suggestions, 0, 5);
    }

    private function assertConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new MistralGenerationException('Le service de génération n\'est pas configuré.', 503);
        }
    }

    private function callMistral(string $systemPrompt, string $userPrompt, bool $jsonObject = false): string
    {
        $payload = [
            'model' => $this->model,
            'temperature' => self::TEMPERATURE,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ];
        if ($jsonObject) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

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
staying within the requested word-count range, tone, and target audience.
Structure: H1 title, an introduction, several H2/H3 sections, and a short conclusion.
Use natural keyword placement. Output ONLY the Markdown body — no preamble, no code fences.
PROMPT;
        }

        return <<<PROMPT
Tu es un rédacteur SEO expérimenté. Produis un article complet en Markdown,
en restant dans la fourchette de mots demandée, le ton et l'audience demandés.
Structure : titre H1, introduction, plusieurs sections H2/H3, courte conclusion.
Place les mots-clés naturellement. Renvoie UNIQUEMENT le corps Markdown — pas de préambule, pas de bloc de code.
PROMPT;
    }

    private function buildContentUserPrompt(string $title, ?string $tone, ?string $audience, int $minWords, int $maxWords, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        $lines[] = $isEn ? 'Article title: ' . $title : 'Titre de l\'article : ' . $title;
        $lines[] = $isEn
            ? 'Word count: between ' . $minWords . ' and ' . $maxWords . ' words'
            : 'Nombre de mots : entre ' . $minWords . ' et ' . $maxWords . ' mots';
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

    private function buildActionSystemPrompt(string $action, string $locale): string
    {
        $isEn = $locale === 'en';
        $instructions = match ($action) {
            'improve-style' => $isEn
                ? 'Rewrite the entire article to improve its style: tighter sentences, smoother transitions, stronger verbs. Keep the original meaning, length (±15%), and Markdown structure (same headings).'
                : 'Réécris tout l\'article pour améliorer son style : phrases plus concises, transitions plus fluides, verbes plus forts. Conserve le sens d\'origine, la longueur (±15%) et la structure Markdown (mêmes titres).',
            'add-intro' => $isEn
                ? 'Add a compelling 2-3 paragraph introduction to the article that hooks the reader. Place it RIGHT AFTER the H1 title (or at the very start if no H1). Keep all the existing content unchanged. Output the FULL article with the new intro merged.'
                : 'Ajoute une introduction percutante de 2 à 3 paragraphes qui accroche le lecteur. Place-la JUSTE APRÈS le titre H1 (ou tout au début s\'il n\'y a pas de H1). Conserve tout le contenu existant tel quel. Renvoie l\'article COMPLET avec la nouvelle intro intégrée.',
            'optimize-seo' => $isEn
                ? 'Rewrite the entire article to improve SEO: natural keyword placement based on the title, clear H2/H3 structure, short paragraphs, meta-ready opening sentence. Keep the original meaning and approximate length.'
                : 'Réécris tout l\'article pour améliorer son SEO : placement naturel des mots-clés basé sur le titre, structure H2/H3 claire, paragraphes courts, phrase d\'ouverture optimisée pour les méta-descriptions. Conserve le sens d\'origine et la longueur approximative.',
            default => throw new \InvalidArgumentException('Action inconnue : ' . $action),
        };

        $base = $isEn
            ? "You are an experienced SEO content editor. {INSTRUCTIONS} Output ONLY the resulting Markdown body — no preamble, no code fences."
            : "Tu es un éditeur de contenu SEO expérimenté. {INSTRUCTIONS} Renvoie UNIQUEMENT le corps Markdown résultant — pas de préambule, pas de bloc de code.";

        return str_replace('{INSTRUCTIONS}', $instructions, $base);
    }

    private function buildActionUserPrompt(string $title, string $content, ?string $tone, ?string $audience, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        $lines[] = $isEn ? 'Article title: ' . $title : 'Titre de l\'article : ' . $title;
        if ($tone !== null && $tone !== '') {
            $lines[] = $isEn ? 'Tone: ' . $tone : 'Ton : ' . $tone;
        }
        if ($audience !== null && $audience !== '') {
            $lines[] = $isEn ? 'Target audience: ' . $audience : 'Audience cible : ' . $audience;
        }
        $lines[] = $isEn ? 'Output language: English.' : 'Langue de sortie : français.';
        $lines[] = '';
        $lines[] = $isEn ? 'Current article content (Markdown):' : 'Contenu actuel de l\'article (Markdown) :';
        $lines[] = $content;

        return implode("\n", $lines);
    }

    private function buildSuggestionsSystemPrompt(string $locale): string
    {
        if ($locale === 'en') {
            return <<<PROMPT
You are an SEO editorial coach. Given a draft article, propose 3 SHORT, ACTIONABLE improvements
(one sentence each, max 200 characters). Focus on what would have the biggest impact:
missing sections, weak intros, SEO opportunities, structure issues, etc.
Reply with a STRICT JSON object: {"suggestions":["...","...","..."]}
No preamble, no code fences.
PROMPT;
        }

        return <<<PROMPT
Tu es un coach éditorial SEO. À partir d'un brouillon d'article, propose 3 améliorations COURTES
et ACTIONNABLES (une phrase chacune, 200 caractères max). Concentre-toi sur ce qui aurait le plus d'impact :
sections manquantes, intros faibles, opportunités SEO, problèmes de structure, etc.
Réponds avec un objet JSON STRICT : {"suggestions":["...","...","..."]}
Pas de préambule, pas de bloc de code.
PROMPT;
    }

    private function buildSuggestionsUserPrompt(string $title, string $content, string $locale): string
    {
        $isEn = $locale === 'en';
        $lines = [];
        $lines[] = $isEn ? 'Article title: ' . $title : 'Titre de l\'article : ' . $title;
        $lines[] = $isEn ? 'Output language: English.' : 'Langue de sortie : français.';
        $lines[] = '';
        $lines[] = $isEn ? 'Article content (Markdown):' : 'Contenu de l\'article (Markdown) :';
        $lines[] = $content === '' ? ($isEn ? '(empty draft)' : '(brouillon vide)') : $content;

        return implode("\n", $lines);
    }
}
