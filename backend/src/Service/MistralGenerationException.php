<?php

namespace App\Service;

/**
 * Exception métier levée par MistralIdeaGeneratorService lorsque la génération échoue.
 * Le code HTTP suggéré pour la réponse API est porté par $code (502 ou 503).
 */
class MistralGenerationException extends \RuntimeException
{
    public function __construct(string $message, int $httpStatus = 502, ?\Throwable $previous = null)
    {
        parent::__construct($message, $httpStatus, $previous);
    }
}
