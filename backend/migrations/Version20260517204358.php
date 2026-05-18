<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260517204358 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la colonne role (user|admin) à la table user. Les comptes existants restent en role=user. Le premier admin doit être promu via la commande app:user:promote.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD role VARCHAR(20) DEFAULT \'user\' NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP role');
    }
}
