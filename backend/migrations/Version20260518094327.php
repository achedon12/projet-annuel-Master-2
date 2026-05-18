<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260518094327 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute scheduled_at/google_event_id sur article + refresh_token/token_expires_at/scopes sur integration pour l\'intégration Google Calendar.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article ADD scheduled_at DATETIME DEFAULT NULL, ADD google_event_id VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_article_scheduled_at ON article (scheduled_at)');
        $this->addSql('CREATE INDEX idx_article_google_event ON article (google_event_id)');
        $this->addSql('ALTER TABLE integration ADD refresh_token LONGTEXT DEFAULT NULL, ADD token_expires_at DATETIME DEFAULT NULL, ADD scopes LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_article_scheduled_at ON article');
        $this->addSql('DROP INDEX idx_article_google_event ON article');
        $this->addSql('ALTER TABLE article DROP scheduled_at, DROP google_event_id');
        $this->addSql('ALTER TABLE integration DROP refresh_token, DROP token_expires_at, DROP scopes');
    }
}
