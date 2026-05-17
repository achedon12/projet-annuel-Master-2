<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Entity\Article;
use App\Entity\User;
use App\Repository\ArticleRepository;
use App\Service\JwtAuthService;
use App\Service\MistralArticleService;
use App\Service\MistralGenerationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/articles')]
class ArticleController extends ApiAbstractController
{
    private const TITLE_MIN = 2;
    private const TITLE_MAX = 255;
    private const CONTENT_MAX = 200_000;
    private const META_MAX = 160;
    private const TONE_MAX = 30;
    private const AUDIENCE_MAX = 30;
    private const PARAGRAPH_MAX = 5000;
    private const ALLOWED_LOCALES = ['fr', 'en'];

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly ArticleRepository $repository,
        private readonly EntityManagerInterface $em,
        private readonly MistralArticleService $generator,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('', name: 'api_articles_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $status = $request->query->get('status');
        $type = $request->query->get('type');
        if ($status !== null && !in_array($status, Article::STATUSES, true)) {
            return $this->json(['error' => 'Statut invalide.'], Response::HTTP_BAD_REQUEST);
        }
        if ($type !== null && !in_array($type, Article::TYPES, true)) {
            return $this->json(['error' => 'Type invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $articles = $this->repository->findByUser($user, $status, $type);

        return $this->json([
            'items' => array_map(fn(Article $a) => $this->serialize($a), $articles),
        ]);
    }

    #[Route('', name: 'api_articles_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $article = new Article();
        $article->setUser($user);

        $error = $this->applyPayload($article, $data, true);
        if ($error !== null) {
            return $this->json(['error' => $error], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($article);
        $this->em->flush();

        return $this->json($this->serialize($article), Response::HTTP_CREATED);
    }

    #[Route('/generate-content', name: 'api_articles_generate_content', methods: ['POST'])]
    public function generateContent(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $title = isset($data['title']) && is_string($data['title']) ? trim($data['title']) : '';
        if (mb_strlen($title) < self::TITLE_MIN || mb_strlen($title) > self::TITLE_MAX) {
            return $this->json(
                ['error' => 'Le titre doit contenir entre ' . self::TITLE_MIN . ' et ' . self::TITLE_MAX . ' caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $tone = $this->stringOrNull($data['tone'] ?? null, self::TONE_MAX);
        $audience = $this->stringOrNull($data['audience'] ?? null, self::AUDIENCE_MAX);
        $targetWords = isset($data['targetWords']) && is_int($data['targetWords']) ? $data['targetWords'] : 800;
        $locale = $this->parseLocale($data['locale'] ?? null);

        try {
            $content = $this->generator->generateContent($title, $tone, $audience, $targetWords, $locale);
        } catch (MistralGenerationException $e) {
            $status = $this->mapHttpStatus($e->getCode());
            return $this->json(['error' => $e->getMessage()], $status);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur inattendue lors de la génération de contenu.', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Erreur interne lors de la génération.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'content' => $content,
            'wordCount' => $this->countWords($content),
        ]);
    }

    #[Route('/rewrite', name: 'api_articles_rewrite', methods: ['POST'])]
    public function rewrite(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $paragraph = isset($data['paragraph']) && is_string($data['paragraph']) ? trim($data['paragraph']) : '';
        if ($paragraph === '' || mb_strlen($paragraph) > self::PARAGRAPH_MAX) {
            return $this->json(
                ['error' => 'Le paragraphe doit contenir entre 1 et ' . self::PARAGRAPH_MAX . ' caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $tone = $this->stringOrNull($data['tone'] ?? null, self::TONE_MAX);
        $locale = $this->parseLocale($data['locale'] ?? null);

        try {
            $rewritten = $this->generator->rewriteParagraph($paragraph, $tone, $locale);
        } catch (MistralGenerationException $e) {
            $status = $this->mapHttpStatus($e->getCode());
            return $this->json(['error' => $e->getMessage()], $status);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur inattendue lors de la reformulation.', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Erreur interne lors de la reformulation.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['paragraph' => $rewritten]);
    }

    #[Route('/{id}', name: 'api_articles_read', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function read(int $id, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $article = $this->findOwned($id, $user);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($article));
    }

    #[Route('/{id}', name: 'api_articles_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $article = $this->findOwned($id, $user);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->decodeBody($request);
        if ($data === null) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $error = $this->applyPayload($article, $data, false);
        if ($error !== null) {
            return $this->json(['error' => $error], Response::HTTP_BAD_REQUEST);
        }

        $article->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json($this->serialize($article));
    }

    #[Route('/{id}', name: 'api_articles_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $article = $this->findOwned($id, $user);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($article);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/publish', name: 'api_articles_publish', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function publish(int $id, Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $article = $this->findOwned($id, $user);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $article->setStatus(Article::STATUS_PUBLISHED);
        $article->setPublishedAt(new \DateTime());
        $article->setUpdatedAt(new \DateTime());
        $this->em->flush();

        return $this->json($this->serialize($article));
    }

    private function findOwned(int $id, User $user): ?Article
    {
        return $this->repository->findOneBy(['id' => $id, 'user' => $user]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);
        return is_array($data) ? $data : null;
    }

    /**
     * Applique le payload sur une entité Article. Renvoie null si OK, sinon un message d'erreur FR.
     *
     * @param array<string, mixed> $data
     */
    private function applyPayload(Article $article, array $data, bool $isCreate): ?string
    {
        if ($isCreate || array_key_exists('title', $data)) {
            $title = isset($data['title']) && is_string($data['title']) ? trim($data['title']) : '';
            if (mb_strlen($title) < self::TITLE_MIN || mb_strlen($title) > self::TITLE_MAX) {
                return 'Le titre doit contenir entre ' . self::TITLE_MIN . ' et ' . self::TITLE_MAX . ' caractères.';
            }
            $article->setTitle($title);
        }

        if (array_key_exists('content', $data)) {
            $content = $data['content'];
            if ($content !== null && !is_string($content)) {
                return 'Le contenu doit être une chaîne ou null.';
            }
            if (is_string($content) && mb_strlen($content) > self::CONTENT_MAX) {
                return 'Le contenu est trop long (max ' . self::CONTENT_MAX . ' caractères).';
            }
            $article->setContent($content);
            $article->setWordCount(is_string($content) ? $this->countWords($content) : 0);
        }

        if (array_key_exists('meta', $data)) {
            $meta = $data['meta'];
            if ($meta !== null && (!is_string($meta) || mb_strlen($meta) > self::META_MAX)) {
                return 'La méta description doit contenir au maximum ' . self::META_MAX . ' caractères.';
            }
            $article->setMeta($meta);
        }

        if (array_key_exists('status', $data)) {
            $status = $data['status'];
            if (!is_string($status) || !in_array($status, Article::STATUSES, true)) {
                return 'Statut invalide.';
            }
            $article->setStatus($status);
            if ($status === Article::STATUS_PUBLISHED && $article->getPublishedAt() === null) {
                $article->setPublishedAt(new \DateTime());
            }
        }

        if (array_key_exists('type', $data)) {
            $type = $data['type'];
            if ($type !== null && (!is_string($type) || !in_array($type, Article::TYPES, true))) {
                return 'Type invalide.';
            }
            $article->setType($type);
        }

        if (array_key_exists('tone', $data)) {
            $article->setTone($this->stringOrNull($data['tone'], self::TONE_MAX));
        }
        if (array_key_exists('audience', $data)) {
            $article->setAudience($this->stringOrNull($data['audience'], self::AUDIENCE_MAX));
        }

        if (array_key_exists('seoScore', $data)) {
            $score = $data['seoScore'];
            if ($score !== null && (!is_int($score) || $score < 0 || $score > 100)) {
                return 'Le score SEO doit être un entier entre 0 et 100.';
            }
            $article->setSeoScore($score);
        }

        return null;
    }

    private function stringOrNull(mixed $value, int $maxLength): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }
        return mb_substr($trimmed, 0, $maxLength);
    }

    private function parseLocale(mixed $value): string
    {
        if (is_string($value) && in_array($value, self::ALLOWED_LOCALES, true)) {
            return $value;
        }
        return 'fr';
    }

    private function countWords(string $content): int
    {
        $trimmed = trim($content);
        if ($trimmed === '') {
            return 0;
        }
        return count(preg_split('/\s+/u', $trimmed) ?: []);
    }

    private function mapHttpStatus(int $code): int
    {
        return in_array($code, [Response::HTTP_BAD_GATEWAY, Response::HTTP_SERVICE_UNAVAILABLE], true)
            ? $code
            : Response::HTTP_BAD_GATEWAY;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Article $article): array
    {
        return [
            'id' => $article->getId(),
            'title' => $article->getTitle(),
            'content' => $article->getContent(),
            'meta' => $article->getMeta(),
            'status' => $article->getStatus(),
            'type' => $article->getType(),
            'tone' => $article->getTone(),
            'audience' => $article->getAudience(),
            'seoScore' => $article->getSeoScore(),
            'wordCount' => $article->getWordCount() ?? 0,
            'createdAt' => $article->getCreatedAt()?->format('c'),
            'updatedAt' => $article->getUpdatedAt()?->format('c'),
            'publishedAt' => $article->getPublishedAt()?->format('c'),
        ];
    }
}
