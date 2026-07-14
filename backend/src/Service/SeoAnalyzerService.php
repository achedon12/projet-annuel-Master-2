<?php

namespace App\Service;

/**
 * Scoring SEO côté serveur. Contrairement à l'heuristique client (4 critères),
 * on évalue 7 critères pondérés : longueur, titre, structure de titres, densité
 * de mots-clés, lisibilité, liens et introduction. Le score final est un entier
 * 0-100, persistable sur l'article (Article::seoScore).
 */
class SeoAnalyzerService
{
    private const GOOD = 'good';
    private const FAIR = 'fair';
    private const POOR = 'poor';

    /** Poids par critère — somme = 1.0. */
    private const WEIGHTS = [
        'contentLength' => 0.20,
        'titleLength' => 0.12,
        'structure' => 0.15,
        'keywords' => 0.18,
        'readability' => 0.15,
        'links' => 0.10,
        'intro' => 0.10,
    ];

    private const STOP_WORDS = [
        'avec', 'sans', 'pour', 'dans', 'les', 'des', 'une', 'que', 'qui', 'est', 'sur', 'par',
        'plus', 'mais', 'son', 'ses', 'leur', 'cette', 'nous', 'vous', 'ils', 'elle', 'aux',
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'has', 'have', 'you',
        'your', 'their', 'they', 'not', 'but', 'can', 'all', 'any', 'our', 'its',
    ];

    /**
     * @return array{score:int, checks:array<int,array{key:string,verdict:string,weight:float}>, keywords:array<int,string>, wordCount:int}
     */
    public function analyze(string $title, string $content, string $locale = 'fr'): array
    {
        $words = $this->words($content);
        $wordCount = count($words);

        [$keywordVerdict, $keywords] = $this->keywordCheck($words, $wordCount);

        $verdicts = [
            'contentLength' => $this->contentLengthCheck($wordCount),
            'titleLength' => $this->titleCheck($title),
            'structure' => $this->structureCheck($content),
            'keywords' => $keywordVerdict,
            'readability' => $this->readabilityCheck($content),
            'links' => $this->linksCheck($content),
            'intro' => $this->introCheck($content),
        ];

        $checks = [];
        $score = 0.0;
        foreach (self::WEIGHTS as $key => $weight) {
            $verdict = $verdicts[$key];
            $score += $this->points($verdict) * $weight;
            $checks[] = ['key' => $key, 'verdict' => $verdict, 'weight' => $weight];
        }

        return [
            'score' => (int) round($score),
            'checks' => $checks,
            'keywords' => array_slice($keywords, 0, 8),
            'wordCount' => $wordCount,
        ];
    }

    private function points(string $verdict): int
    {
        return match ($verdict) {
            self::GOOD => 100,
            self::FAIR => 55,
            default => 15,
        };
    }

    /** @return array<int, string> */
    private function words(string $content): array
    {
        $plain = mb_strtolower(strip_tags($content));
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $plain) ?: [];
        return array_values(array_filter($parts, static fn (string $w): bool => $w !== ''));
    }

    private function contentLengthCheck(int $wordCount): string
    {
        if ($wordCount >= 600) {
            return self::GOOD;
        }
        if ($wordCount >= 300) {
            return self::FAIR;
        }
        return self::POOR;
    }

    private function titleCheck(string $title): string
    {
        $len = mb_strlen(trim($title));
        if ($len >= 40 && $len <= 65) {
            return self::GOOD;
        }
        if ($len >= 25 && $len <= 75) {
            return self::FAIR;
        }
        return self::POOR;
    }

    private function structureCheck(string $content): string
    {
        preg_match_all('/^#{2,3}\s+\S/mu', $content, $m);
        $headings = count($m[0]);
        if ($headings >= 2) {
            return self::GOOD;
        }
        if ($headings === 1) {
            return self::FAIR;
        }
        return self::POOR;
    }

    /**
     * @param array<int, string> $words
     *
     * @return array{0:string, 1:array<int,string>}
     */
    private function keywordCheck(array $words, int $wordCount): array
    {
        if ($wordCount === 0) {
            return [self::POOR, []];
        }

        $freq = [];
        foreach ($words as $w) {
            if (mb_strlen($w) < 4 || in_array($w, self::STOP_WORDS, true)) {
                continue;
            }
            $freq[$w] = ($freq[$w] ?? 0) + 1;
        }
        if ($freq === []) {
            return [self::POOR, []];
        }
        arsort($freq);
        $keywords = array_keys($freq);
        $topDensity = reset($freq) / $wordCount;

        // Densité idéale du mot-clé principal : ~0,8 % à 3 %.
        if ($topDensity >= 0.008 && $topDensity <= 0.03) {
            $verdict = self::GOOD;
        } elseif ($topDensity >= 0.004 && $topDensity <= 0.05) {
            $verdict = self::FAIR;
        } else {
            $verdict = self::POOR;
        }

        return [$verdict, $keywords];
    }

    private function readabilityCheck(string $content): string
    {
        $text = trim(strip_tags($content));
        if ($text === '') {
            return self::POOR;
        }
        $sentences = preg_split('/[.!?]+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $sentenceCount = max(1, count($sentences));
        $wordCount = count($this->words($content));
        $avg = $wordCount / $sentenceCount;

        if ($avg > 0 && $avg <= 22) {
            return self::GOOD;
        }
        if ($avg <= 30) {
            return self::FAIR;
        }
        return self::POOR;
    }

    private function linksCheck(string $content): string
    {
        preg_match_all('/\[[^\]]+\]\([^)]+\)/u', $content, $m);
        $links = count($m[0]);
        if ($links >= 2) {
            return self::GOOD;
        }
        if ($links === 1) {
            return self::FAIR;
        }
        return self::POOR;
    }

    private function introCheck(string $content): string
    {
        $blocks = preg_split('/\n\s*\n/u', trim($content)) ?: [];
        foreach ($blocks as $block) {
            $block = trim($block);
            if ($block === '' || str_starts_with($block, '#')) {
                continue;
            }
            $len = count($this->words($block));
            if ($len >= 25 && $len <= 90) {
                return self::GOOD;
            }
            if ($len >= 12) {
                return self::FAIR;
            }
            return self::POOR;
        }
        return self::POOR;
    }
}
