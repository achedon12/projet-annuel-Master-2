<?php

namespace App\Service;

class Translator
{
    private array $translations = [];
    private string $locale;

    public function __construct(string $locale = 'en')
    {
        $this->locale = $locale;
        $this->loadTranslations();
    }

    /**
     * Charge les traductions depuis les fichiers YAML
     */
    private function loadTranslations(): void
    {
        $translationsDir = dirname(__DIR__, 2) . '/translations';
        $file = $translationsDir . '/messages.' . $this->locale . '.yaml';

        if (!file_exists($file)) {
            $file = $translationsDir . '/messages.en.yaml';
        }

        if (file_exists($file)) {
            $this->translations = $this->parseYaml($file);
        }
    }

    /**
     * Retourne une traduction
     */
    public function trans(string $key, array $parameters = []): string
    {
        $value = $this->getValueByKey($key, $this->translations);

        if ($value === null) {
            return $key;
        }

        // Remplacer les paramètres
        foreach ($parameters as $param => $val) {
            $value = str_replace('{' . $param . '}', $val, $value);
        }

        return $value;
    }

    /**
     * Retourne une valeur imbriquée par clé pointée
     */
    private function getValueByKey(string $key, array $array): ?string
    {
        $keys = explode('.', $key);
        $value = $array;

        foreach ($keys as $k) {
            if (is_array($value) && isset($value[$k])) {
                $value = $value[$k];
            } else {
                return null;
            }
        }

        return is_string($value) ? $value : null;
    }

    /**
     * Parse un fichier YAML simplifié
     */
    private function parseYaml(string $filePath): array
    {
        $content = file_get_contents($filePath);
        $lines = explode("\n", $content);
        $result = [];
        $stack = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if (empty($trimmed) || str_starts_with($trimmed, '#')) {
                continue;
            }

            $indent = strlen($line) - strlen(ltrim($line));
            $level = intdiv($indent, 2);

            // Réduire le stack si l'indentation diminue
            while (count($stack) > $level) {
                array_pop($stack);
            }

            if (str_contains($trimmed, ':')) {
                [$key, $value] = explode(':', $trimmed, 2);
                $key = trim($key);
                $value = trim($value);
                $value = trim($value, '"\'');

                $stack[$level] = $key;
                if (empty($value)) {
                    $this->createNestedArray($result, $stack);
                } else {
                    $this->setNestedValue($result, $stack, $value);
                }
            }
        }

        return $result;
    }

    /**
     * Crée une structure imbriquée
     */
    private function createNestedArray(array &$array, array $path): void
    {
        $current = &$array;
        foreach ($path as $key) {
            if (!isset($current[$key])) {
                $current[$key] = [];
            }
            $current = &$current[$key];
        }
    }

    /**
     * Définit une valeur imbriquée
     */
    private function setNestedValue(array &$array, array $path, mixed $value): void
    {
        $current = &$array;
        foreach ($path as $i => $key) {
            if ($i === count($path) - 1) {
                $current[$key] = $value;
            } else {
                if (!isset($current[$key])) {
                    $current[$key] = [];
                }
                $current = &$current[$key];
            }
        }
    }

    /**
     * Change la locale
     */
    public function setLocale(string $locale): void
    {
        $this->locale = $locale;
        $this->translations = [];
        $this->loadTranslations();
    }

    /**
     * Retourne la locale actuelle
     */
    public function getLocale(): string
    {
        return $this->locale;
    }
}

