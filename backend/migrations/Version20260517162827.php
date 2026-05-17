<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Création de la table user_login_ips pour l'historique des connexions par IP.
 */
final class Version20260517162827 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create user_login_ips table to track user login IP history';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE user_login_ips (
            id BIGINT AUTO_INCREMENT NOT NULL,
            user_id BIGINT NOT NULL,
            ip_address VARCHAR(45) NOT NULL,
            user_agent LONGTEXT DEFAULT NULL,
            event VARCHAR(50) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            last_seen_at DATETIME DEFAULT NULL,
            INDEX idx_user_login_ips_user (user_id),
            INDEX idx_user_login_ips_user_ip (user_id, ip_address),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');

        $this->addSql('ALTER TABLE user_login_ips
            ADD CONSTRAINT FK_USER_LOGIN_IPS_USER
            FOREIGN KEY (user_id) REFERENCES `user` (id)
            ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_login_ips DROP FOREIGN KEY FK_USER_LOGIN_IPS_USER');
        $this->addSql('DROP TABLE user_login_ips');
    }
}
