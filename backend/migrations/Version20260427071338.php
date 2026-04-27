<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260427071338 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE article (id BIGINT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, content LONGTEXT DEFAULT NULL, meta VARCHAR(160) DEFAULT NULL, seo_score INT DEFAULT NULL, status VARCHAR(10) DEFAULT \'draft\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id BIGINT NOT NULL, idea_id BIGINT DEFAULT NULL, edit_article_id BIGINT DEFAULT NULL, INDEX IDX_23A0E66A76ED395 (user_id), UNIQUE INDEX UNIQ_23A0E665B6FEF7D (idea_id), UNIQUE INDEX UNIQ_23A0E66E7695588 (edit_article_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE edit_article (id BIGINT AUTO_INCREMENT NOT NULL, tone VARCHAR(255) NOT NULL, audience LONGTEXT DEFAULT NULL, beginning VARCHAR(160) DEFAULT NULL, user_id BIGINT NOT NULL, idea_id BIGINT DEFAULT NULL, INDEX IDX_B8C4B5DCA76ED395 (user_id), UNIQUE INDEX UNIQ_B8C4B5DC5B6FEF7D (idea_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE idea (id BIGINT AUTO_INCREMENT NOT NULL, keyword VARCHAR(255) NOT NULL, audience VARCHAR(255) DEFAULT NULL, type VARCHAR(255) DEFAULT NULL, date DATETIME NOT NULL, user_id BIGINT NOT NULL, INDEX IDX_A8BCA45A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE integration (id BIGINT AUTO_INCREMENT NOT NULL, type VARCHAR(10) NOT NULL, api_key LONGTEXT NOT NULL, url VARCHAR(255) DEFAULT NULL, active TINYINT DEFAULT 0 NOT NULL, last_sync DATETIME DEFAULT NULL, user_id BIGINT NOT NULL, INDEX IDX_FDE96D9BA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, avatar LONGTEXT DEFAULT NULL, bio LONGTEXT DEFAULT NULL, language VARCHAR(5) DEFAULT NULL, theme VARCHAR(10) DEFAULT \'system\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, last_login DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_8D93D649E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E66A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E665B6FEF7D FOREIGN KEY (idea_id) REFERENCES idea (id)');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E66E7695588 FOREIGN KEY (edit_article_id) REFERENCES edit_article (id)');
        $this->addSql('ALTER TABLE edit_article ADD CONSTRAINT FK_B8C4B5DCA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE edit_article ADD CONSTRAINT FK_B8C4B5DC5B6FEF7D FOREIGN KEY (idea_id) REFERENCES idea (id)');
        $this->addSql('ALTER TABLE idea ADD CONSTRAINT FK_A8BCA45A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE integration ADD CONSTRAINT FK_FDE96D9BA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E66A76ED395');
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E665B6FEF7D');
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E66E7695588');
        $this->addSql('ALTER TABLE edit_article DROP FOREIGN KEY FK_B8C4B5DCA76ED395');
        $this->addSql('ALTER TABLE edit_article DROP FOREIGN KEY FK_B8C4B5DC5B6FEF7D');
        $this->addSql('ALTER TABLE idea DROP FOREIGN KEY FK_A8BCA45A76ED395');
        $this->addSql('ALTER TABLE integration DROP FOREIGN KEY FK_FDE96D9BA76ED395');
        $this->addSql('DROP TABLE article');
        $this->addSql('DROP TABLE edit_article');
        $this->addSql('DROP TABLE idea');
        $this->addSql('DROP TABLE integration');
        $this->addSql('DROP TABLE `user`');
    }
}
