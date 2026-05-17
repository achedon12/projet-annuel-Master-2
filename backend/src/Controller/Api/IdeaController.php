<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Service\JwtAuthService;
use App\Service\MistralGenerationException;
use App\Service\MistralIdeaGeneratorService;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/ideas')]
class IdeaController extends ApiAbstractController
{
    private const ALLOWED_CONTENT_TYPES = ['blog', 'guide', 'listicle', 'tutorial', 'case-study'];
    private const ALLOWED_LOCALES = ['fr', 'en'];
    private const KEYWORD_MIN = 2;
    private const KEYWORD_MAX = 120;
    private const AUDIENCE_MAX = 500;

    public function __construct(
        private readonly JwtAuthService $jwtAuth,
        private readonly MistralIdeaGeneratorService $generator,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/generate', name: 'api_ideas_generate', methods: ['POST'])]
    public function generate(Request $request): JsonResponse
    {
        $user = $this->jwtAuth->authenticate($request);
        if (!$user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $raw = $request->getContent();
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Corps de requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $keyword = isset($data['keyword']) && is_string($data['keyword']) ? trim($data['keyword']) : '';
        $keywordLength = mb_strlen($keyword);
        if ($keywordLength < self::KEYWORD_MIN || $keywordLength > self::KEYWORD_MAX) {
            return $this->json(
                ['error' => 'Le mot-clé principal doit contenir entre ' . self::KEYWORD_MIN . ' et ' . self::KEYWORD_MAX . ' caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $contentType = null;
        if (isset($data['contentType']) && is_string($data['contentType']) && $data['contentType'] !== '') {
            $contentType = trim($data['contentType']);
            if (!in_array($contentType, self::ALLOWED_CONTENT_TYPES, true)) {
                return $this->json(['error' => 'Type de contenu invalide.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $audience = null;
        if (isset($data['audience']) && is_string($data['audience']) && trim($data['audience']) !== '') {
            $audience = trim($data['audience']);
            if (mb_strlen($audience) > self::AUDIENCE_MAX) {
                return $this->json(
                    ['error' => 'L\'audience cible ne doit pas dépasser ' . self::AUDIENCE_MAX . ' caractères.'],
                    Response::HTTP_BAD_REQUEST,
                );
            }
        }

        $locale = 'fr';
        if (isset($data['locale']) && is_string($data['locale']) && in_array($data['locale'], self::ALLOWED_LOCALES, true)) {
            $locale = $data['locale'];
        }

        try {
            $ideas = $this->generator->generate($keyword, $contentType, $audience, $locale);
        } catch (MistralGenerationException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : Response::HTTP_BAD_GATEWAY;
            return $this->json(['error' => $e->getMessage()], $status);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur inattendue lors de la génération d\'idées.', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Erreur interne lors de la génération.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['ideas' => $ideas]);
    }
}
