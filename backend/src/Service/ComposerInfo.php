<?php

namespace App\Service;

use RuntimeException;

class ComposerInfo
{
    private string $projectRoot;
    private ?array $composerData = null;
    private ?array $composerLock = null;

    public function __construct(string $projectRoot = null)
    {
        $this->projectRoot = $projectRoot ?? dirname(__DIR__, 2);
    }

    /**
     * Charge et retourne les données du fichier composer.json
     */
    public function getComposerJson(): array
    {
        if ($this->composerData === null) {
            $this->composerData = $this->loadJsonFile('composer.json');
        }
        return $this->composerData;
    }

    /**
     * Charge et retourne les données du fichier composer.lock
     */
    public function getComposerLock(): array
    {
        if ($this->composerLock === null) {
            $this->composerLock = $this->loadJsonFile('composer.lock');
        }
        return $this->composerLock;
    }

    /**
     * Retourne les dépendances requises
     */
    public function getRequiredDependencies(): array
    {
        return $this->getComposerJson()['require'] ?? [];
    }

    /**
     * Retourne les dépendances de développement
     */
    public function getDevDependencies(): array
    {
        return $this->getComposerJson()['require-dev'] ?? [];
    }

    /**
     * Retourne toutes les dépendances (requises + dev)
     */
    public function getAllDependencies(): array
    {
        return array_merge(
            $this->getRequiredDependencies(),
            $this->getDevDependencies()
        );
    }

    /**
     * Retourne le nombre total de dépendances
     */
    public function getDependenciesCount(): int
    {
        return count($this->getAllDependencies());
    }

    /**
     * Retourne la version d'une dépendance spécifique
     */
    public function getDependencyVersion(string $packageName): ?string
    {
        $dependencies = $this->getAllDependencies();
        return $dependencies[$packageName] ?? null;
    }

    /**
     * Retourne les packages verrouillés (versions exactes du composer.lock)
     */
    public function getLockedPackages(): array
    {
        $lock = $this->getComposerLock();
        $packages = [];

        foreach ($lock['packages'] ?? [] as $package) {
            $packages[$package['name']] = [
                'version' => $package['version'],
                'type' => $package['type'] ?? null,
            ];
        }

        return $packages;
    }

    /**
     * Retourne un résumé des informations Composer
     */
    public function getSummary(): array
    {
        $composer = $this->getComposerJson();

        return [
            'type' => $composer['type'] ?? 'unknown',
            'license' => $composer['license'] ?? 'unknown',
            'minimum_stability' => $composer['minimum-stability'] ?? 'stable',
            'required_php_version' => $this->getPhpVersionRequirement(),
            'total_dependencies' => $this->getDependenciesCount(),
            'required_count' => count($this->getRequiredDependencies()),
            'dev_count' => count($this->getDevDependencies()),
            'description' => $composer['description'] ?? null,
        ];
    }

    /**
     * Retourne la version PHP requise
     */
    public function getPhpVersionRequirement(): ?string
    {
        $required = $this->getRequiredDependencies();
        return $required['php'] ?? null;
    }

    /**
     * Retourne le nom du projet depuis composer.json
     */
    public function getProjectName(): ?string
    {
        return $this->getComposerJson()['name'] ?? null;
    }

    /**
     * Retourne la version du projet depuis composer.json
     */
    public function getProjectVersion(): ?string
    {
        return $this->getComposerJson()['version'] ?? null;
    }

    /**
     * Retourne la description du projet
     */
    public function getProjectDescription(): ?string
    {
        return $this->getComposerJson()['description'] ?? null;
    }

    /**
     * Charge un fichier JSON
     */
    private function loadJsonFile(string $filename): array
    {
        $filePath = $this->projectRoot . '/' . $filename;

        if (!file_exists($filePath)) {
            throw new RuntimeException(sprintf('File not found: %s', $filePath));
        }

        $content = file_get_contents($filePath);
        if ($content === false) {
            throw new RuntimeException(sprintf('Cannot read file: %s', $filePath));
        }

        $data = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException(sprintf('Invalid JSON in %s: %s', $filename, json_last_error_msg()));
        }

        return $data;
    }
}

