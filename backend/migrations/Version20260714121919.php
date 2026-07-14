<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260714121919 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE organization_invitation (id BIGINT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, permissions JSON DEFAULT NULL, token_hash VARCHAR(64) NOT NULL, expires_at DATETIME NOT NULL, accepted_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, organization_id BIGINT NOT NULL, invited_by_id BIGINT DEFAULT NULL, UNIQUE INDEX UNIQ_1846F34DB3BC57DA (token_hash), INDEX IDX_1846F34D32C8A3DE (organization_id), INDEX IDX_1846F34DA7B4A7E3 (invited_by_id), INDEX idx_invitation_token_hash (token_hash), INDEX idx_invitation_email (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE organization_invitation ADD CONSTRAINT FK_1846F34D32C8A3DE FOREIGN KEY (organization_id) REFERENCES organization (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE organization_invitation ADD CONSTRAINT FK_1846F34DA7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE user ADD org_permissions JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE organization_invitation DROP FOREIGN KEY FK_1846F34D32C8A3DE');
        $this->addSql('ALTER TABLE organization_invitation DROP FOREIGN KEY FK_1846F34DA7B4A7E3');
        $this->addSql('DROP TABLE organization_invitation');
        $this->addSql('ALTER TABLE `user` DROP org_permissions');
    }
}
