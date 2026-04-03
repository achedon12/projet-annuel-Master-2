<?php

namespace App\Controller;

use App\Repository\ArticleRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ApiController extends AbstractController
{
    public function __construct(private readonly ArticleRepository $articleRepository)
    {
    }

    #[Route('/api/ping', name: 'api_ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return $this->json(['status' => 'ok', 'message' => 'pong']);
    }

    #[Route('/api/articles', name: 'api_articles_list', methods: ['GET'])]
    public function listArticles(): JsonResponse
    {
        $articles = array_map(
            static fn ($article): array => $article->toArray(),
            $this->articleRepository->findAll()
        );

        return $this->json(['items' => $articles]);
    }

    #[Route('/api/articles', name: 'api_articles_create', methods: ['POST'])]
    public function createArticle(Request $request): JsonResponse
    {
        $data = $this->decodeJson($request);

        if (isset($data['error'])) {
            return $this->json(['error' => $data['error']], 400);
        }

        $errors = $this->validateArticlePayload($data, false);
        if ($errors !== []) {
            return $this->json(['errors' => $errors], 422);
        }

        $newArticle = $this->articleRepository->create($data);

        return $this->json($newArticle->toArray(), 201);
    }

    #[Route('/api/articles/{id}', name: 'api_articles_get', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function getArticle(int $id): JsonResponse
    {
        $article = $this->articleRepository->find($id);
        if ($article === null) {
            return $this->json(['error' => 'article not found'], 404);
        }

        return $this->json($article->toArray());
    }

    #[Route('/api/articles/{id}', name: 'api_articles_update', requirements: ['id' => '\\d+'], methods: ['PUT', 'PATCH'])]
    public function updateArticle(int $id, Request $request): JsonResponse
    {
        $article = $this->articleRepository->find($id);
        if ($article === null) {
            return $this->json(['error' => 'article not found'], 404);
        }

        $data = $this->decodeJson($request);
        if (isset($data['error'])) {
            return $this->json(['error' => $data['error']], 400);
        }

        $errors = $this->validateArticlePayload($data, true);
        if ($errors !== []) {
            return $this->json(['errors' => $errors], 422);
        }

        $article->updateFromPayload($data);
        $this->articleRepository->update($article);

        return $this->json($article->toArray());
    }

    #[Route('/api/articles/{id}', name: 'api_articles_delete', requirements: ['id' => '\\d+'], methods: ['DELETE'])]
    public function deleteArticle(int $id): JsonResponse
    {
        if (!$this->articleRepository->delete($id)) {
            return $this->json(['error' => 'article not found'], 404);
        }

        return $this->json(null, 204);
    }

    #[Route('/api/articles/stats', name: 'api_articles_stats', methods: ['GET'])]
    public function articleStats(): JsonResponse
    {
        return $this->json($this->articleRepository->getStats());
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(Request $request): array
    {
        $content = trim($request->getContent());

        if ($content === '') {
            return [];
        }

        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            return ['error' => 'invalid JSON payload'];
        }

        return $decoded;
    }

    /**
     * @return string[]
     */
    private function validateArticlePayload(array $payload, bool $partialUpdate): array
    {
        $errors = [];
        $allowedStatuses = ['draft', 'published', 'review'];

        if (!$partialUpdate || array_key_exists('title', $payload)) {
            $title = trim((string) ($payload['title'] ?? ''));
            if ($title === '') {
                $errors[] = 'title is required';
            }
        }

        if (!$partialUpdate || array_key_exists('content', $payload)) {
            $content = trim((string) ($payload['content'] ?? ''));
            if ($content === '') {
                $errors[] = 'content is required';
            }
        }

        if (array_key_exists('status', $payload) && !in_array($payload['status'], $allowedStatuses, true)) {
            $errors[] = 'status must be one of: draft, published, review';
        }

        if (array_key_exists('seo_score', $payload) && $payload['seo_score'] !== null) {
            $score = (int) $payload['seo_score'];
            if ($score < 0 || $score > 100) {
                $errors[] = 'seo_score must be between 0 and 100';
            }
        }

        return $errors;
    }
}
