<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Création de la table pending_mails (queue d'envois email avec retry).
 */
final class Version20260517164407 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create pending_mails table for batched email sending with retries';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE pending_mails (
            id BIGINT AUTO_INCREMENT NOT NULL,
            to_email VARCHAR(255) NOT NULL,
            to_name VARCHAR(255) DEFAULT NULL,
            from_email VARCHAR(255) DEFAULT NULL,
            from_name VARCHAR(255) DEFAULT NULL,
            subject VARCHAR(255) NOT NULL,
            body_html LONGTEXT NOT NULL,
            body_text LONGTEXT DEFAULT NULL,
            status VARCHAR(20) NOT NULL,
            attempts INT NOT NULL,
            max_attempts INT NOT NULL,
            last_error LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            last_attempt_at DATETIME DEFAULT NULL,
            sent_at DATETIME DEFAULT NULL,
            INDEX idx_pending_mails_status (status),
            INDEX idx_pending_mails_status_created (status, created_at),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE pending_mails');
    }
}
