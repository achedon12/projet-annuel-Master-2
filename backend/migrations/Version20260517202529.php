<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260517202529 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute les préférences IA par défaut (default_tone, default_words) et 6 booleans de notification (email, weekly, ai, comments, updates, tips) à la table user. Tous les flags sauf tips sont true par défaut.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD default_tone VARCHAR(30) DEFAULT NULL, ADD default_words INT DEFAULT 800 NOT NULL, ADD notif_email TINYINT DEFAULT 1 NOT NULL, ADD notif_weekly TINYINT DEFAULT 1 NOT NULL, ADD notif_ai TINYINT DEFAULT 1 NOT NULL, ADD notif_comments TINYINT DEFAULT 1 NOT NULL, ADD notif_updates TINYINT DEFAULT 1 NOT NULL, ADD notif_tips TINYINT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP default_tone, DROP default_words, DROP notif_email, DROP notif_weekly, DROP notif_ai, DROP notif_comments, DROP notif_updates, DROP notif_tips');
    }
}
