<?php

namespace App\Controller\Api;

use App\Controller\ApiAbstractController;
use App\Service\ComposerInfo;
use App\Service\Translator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class InfoController extends ApiAbstractController
{
    private ComposerInfo $composerInfo;
    private Translator $translator;

    public function __construct(ComposerInfo $composerInfo)
    {
        $this->composerInfo = $composerInfo;
        $this->translator = new Translator('fr');
    }

    #[Route('/infos', name: 'api_infos', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $locale = $request->query->get('lang', 'en');
        $this->translator->setLocale($locale);

        $data = [
            'app' => [
                'name' => $this->composerInfo->getProjectName() ?? 'Unknown',
                'version' => $this->composerInfo->getProjectVersion() ?? 'Unknown',
                'description' => $this->composerInfo->getProjectDescription(),
            ],
            'server' => [
                'php_version' => phpversion(),
                'symfony_version' => Kernel::VERSION,
            ],
            'composer' => $this->composerInfo->getSummary(),
            'status' => $this->translator->trans('api.status.ok'),
            'timestamp' => time(),
            'message' => $this->translator->trans('api.welcome'),
            'locale' => $locale,
        ];
        return $this->json($data);
    }
}

