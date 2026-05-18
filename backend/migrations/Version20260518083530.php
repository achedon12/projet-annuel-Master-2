<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260518083530 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute article.notion_page_id pour tracer la page Notion miroir d\'un article exporté.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article ADD notion_page_id VARCHAR(36) DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_article_notion_page ON article (notion_page_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_article_notion_page ON article');
        $this->addSql('ALTER TABLE article DROP notion_page_id');
    }
}
