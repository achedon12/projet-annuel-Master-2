<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260714105133 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE login_token (id BIGINT AUTO_INCREMENT NOT NULL, token VARCHAR(64) NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id BIGINT NOT NULL, UNIQUE INDEX UNIQ_594766AF5F37A13B (token), INDEX IDX_594766AFA76ED395 (user_id), INDEX idx_login_token_token (token), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE login_token ADD CONSTRAINT FK_594766AFA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE login_token DROP FOREIGN KEY FK_594766AFA76ED395');
        $this->addSql('DROP TABLE login_token');
    }
}
