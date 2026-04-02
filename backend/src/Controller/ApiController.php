<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ApiController extends AbstractController
{
    #[Route('/api/ping', name: 'api_ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return $this->json(['status' => 'ok', 'message' => 'pong']);
    }

    #[Route('/api/articles', name: 'api_articles_list', methods: ['GET'])]
    public function listArticles(): JsonResponse
    {
        // TEST
        $articles = [
            ['id' => 1, 'title' => 'First article', 'content' => 'Sample content'],
            ['id' => 2, 'title' => 'Second article', 'content' => 'Another content'],
        ];

        return $this->json(['items' => $articles]);
    }

    #[Route('/api/articles', name: 'api_articles_create', methods: ['POST'])]
    public function createArticle(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $title = $data['title'] ?? null;
        $content = $data['content'] ?? null;

        if (!$title || !$content) {
            return $this->json(['error' => 'title and content are required'], 400);
        }

        // TEST
        $newArticle = [
            'id' => random_int(100, 999),
            'title' => $title,
            'content' => $content,
            'created_at' => (new \DateTimeImmutable())->format('c'),
        ];

        return $this->json($newArticle, 201);
    }

    #[Route('/api/articles/{id}', name: 'api_articles_get', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function getArticle(int $id): JsonResponse
    {
        // TEST
        $article = ['id' => $id, 'title' => "Article $id", 'content' => 'Fetched by id'];

        return $this->json($article);
    }
}
