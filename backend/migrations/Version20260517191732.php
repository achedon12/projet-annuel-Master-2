<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260517191732 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Étend la table article (type, tone, audience, word_count, published_at), élargit status (10→20) avec nouveaux valeurs draft/review/published/archived, ajoute ON DELETE CASCADE sur FK user et index (user_id, status). Normalise les anciennes valeurs pub→published et delete→archived.';
    }

    public function up(Schema $schema): void
    {
        // Normalisation des anciennes valeurs de status avant d'appliquer le nouveau set.
        // L'ancienne entité acceptait draft|pub|delete ; le nouveau set est draft|review|published|archived.
        $this->addSql("UPDATE article SET status = 'published' WHERE status = 'pub'");
        $this->addSql("UPDATE article SET status = 'archived' WHERE status = 'delete'");

        $this->addSql('ALTER TABLE article DROP FOREIGN KEY `FK_23A0E66A76ED395`');
        $this->addSql('ALTER TABLE article ADD type VARCHAR(20) DEFAULT NULL, ADD tone VARCHAR(30) DEFAULT NULL, ADD audience VARCHAR(30) DEFAULT NULL, ADD word_count INT DEFAULT NULL, ADD published_at DATETIME DEFAULT NULL, CHANGE status status VARCHAR(20) DEFAULT \'draft\' NOT NULL');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E66A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX idx_article_user_status ON article (user_id, status)');
        $this->addSql('ALTER TABLE article RENAME INDEX idx_23a0e66a76ed395 TO idx_article_user');

        // Drift cosmétique préexistant de Symfony Messenger (case d'index + types datetime).
        // Profite de cette migration pour le résoudre — aucune perte de données.
        $this->addSql('ALTER TABLE messenger_messages CHANGE queue_name queue_name VARCHAR(190) NOT NULL, CHANGE created_at created_at DATETIME NOT NULL, CHANGE available_at available_at DATETIME NOT NULL, CHANGE delivered_at delivered_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE messenger_messages RENAME INDEX idx_75ea56e016ba318b TO IDX_75EA56E016BA31DB');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E66A76ED395');
        $this->addSql('DROP INDEX idx_article_user_status ON article');
        $this->addSql('ALTER TABLE article DROP type, DROP tone, DROP audience, DROP word_count, DROP published_at, CHANGE status status VARCHAR(10) DEFAULT \'draft\' NOT NULL');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT `FK_23A0E66A76ED395` FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('ALTER TABLE article RENAME INDEX idx_article_user TO IDX_23A0E66A76ED395');
        $this->addSql('ALTER TABLE messenger_messages CHANGE queue_name queue_name VARCHAR(190) DEFAULT \'default\' NOT NULL, CHANGE created_at created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', CHANGE available_at available_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', CHANGE delivered_at delivered_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE messenger_messages RENAME INDEX idx_75ea56e016ba31db TO IDX_75EA56E016BA318B');
    }
}
