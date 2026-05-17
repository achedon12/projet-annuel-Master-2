---
name: doctrine-migration
description: Use when the user asks to change the database schema on the Symfony backend — add/rename a column, a new entity, a new index, a new enum-like field. Covers the diff-based `make:migration` workflow (always migration-driven, never `schema:update --force`), the snake_case_pluriel table naming, FK convention with cascade, MySQL 9 specifics, and the inverse relation pattern on the `User` entity.
---

# Modifier le schéma Doctrine

## Stack

- Doctrine ORM 3 + Doctrine Migrations 3
- MySQL 9 (Docker, image `mysql:9.1`)
- Pas de Schema:update --force en prod ni en dev — toujours migration-driven

## Workflow standard

```bash
# 1. Éditer l'entité (ajout d'une propriété, d'un index, etc.) dans backend/src/Entity/

# 2. Générer la migration (diff de schéma DB ↔ entités)
php bin/console make:migration

# 3. Inspecter le fichier généré dans backend/migrations/VersionYYYYMMDDHHMMSS.php
#    Renommer la description du `getDescription()` si vide.

# 4. Appliquer
php bin/console doctrine:migrations:migrate

# 5. Commit l'entité + la migration ensemble
```

## Conventions du repo

### Naming

- **Table** : snake_case pluriel (`user_login_ips`, `banned_ips`, `pending_mails`). Déclaré via `#[ORM\Table(name: '...')]` sur l'entité.
- **Colonnes** : snake_case (auto-généré depuis camelCase PHP).
- **Index** : `idx_<table>_<champs>`.

### IDs

`BIGINT AUTO_INCREMENT` partout :

```php
#[ORM\Id]
#[ORM\GeneratedValue]
#[ORM\Column(type: Types::BIGINT)]
private ?int $id = null;
```

### Timestamps

- `createdAt` : initialisé dans le constructeur (`$this->createdAt = new \DateTime()`).
- `updatedAt` : optionnel ; à mettre à jour explicitement avec `setUpdatedAt(new \DateTime())` ou via un `@ORM\HasLifecycleCallbacks` selon le cas. Pas de `@PreUpdate` automatique dans ce repo.

### Relations user-scoped

Toujours **cascade ON DELETE** côté SQL pour les FK vers `user` :

```php
#[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'loginIps')]
#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
private ?User $user = null;
```

Et **toujours** ajouter la relation inverse côté `User` :

```php
/** @var Collection<int, UserLoginIp> */
#[ORM\OneToMany(targetEntity: UserLoginIp::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
private Collection $loginIps;
```

Avec :
- Initialisation dans `User::__construct` (`$this->loginIps = new ArrayCollection()`).
- Getter `getLoginIps()` retournant `Collection`.
- `addLoginIp()` / `removeLoginIp()` avec sync de l'autre côté.

### Index

Tout champ utilisé dans un `WHERE` ou `ORDER BY` fréquent doit être indexé via `#[ORM\Index]` sur la classe. Voir `UserLoginIp` pour le pattern (index composite `(user_id, ip_address)`).

### Types

- `VARCHAR(45)` pour les IP (IPv4 + IPv6).
- `TEXT` (`Types::TEXT`) pour les `user_agent`, `last_error`, descriptions longues.
- Enum-like → `VARCHAR(20|50)` + constantes PHP (`public const STATUS_PENDING = 'pending'` sur l'entité). Pas de type `enum` MySQL — le repo préfère des constantes PHP.

### Repository

Tout nouvelle entité a son repo dans `backend/src/Repository/` :

```php
namespace App\Repository;

use App\Entity\MyThing;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<MyThing> */
class MyThingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MyThing::class);
    }
}
```

Référencé depuis l'entité par `#[ORM\Entity(repositoryClass: MyThingRepository::class)]`.

## Pièges MySQL 9

- **Ajouter un champ NOT NULL sans default** sur une table avec des lignes → migration échoue. Soit ajouter `nullable: true`, backfiller via un `addSql` dans la migration, puis une seconde migration pour passer en NOT NULL.
- **Renommer une colonne via `make:migration`** : Doctrine génère un `DROP` + `ADD` (perte de données). Pour un rename, éditer manuellement la migration générée pour utiliser `ALTER TABLE ... CHANGE`.
- **Le nom de table `user`** est réservé : l'entité `User` utilise `` `user` `` (backticks). Voir `User.php` : `#[ORM\Table(name: '`user`')]`.
- **Cascade orphanRemoval** : `orphanRemoval: true` côté Doctrine fait la suppression côté ORM, mais en plus on déclare `onDelete: 'CASCADE'` côté DB pour couvrir les deletes directs en SQL.

## Vérifications après migration

```bash
php bin/console doctrine:schema:validate     # doit dire "in sync"
php bin/console doctrine:migrations:status   # toutes les migrations doivent être Applied
```

## Référence

- `backend/src/Entity/UserLoginIp.php` + `backend/migrations/Version20260517162827.php` — exemple d'entité avec FK user + index composite + relation inverse sur `User`.
- `backend/src/Entity/PendingMail.php` + `backend/migrations/Version20260517164407.php` — exemple sans FK avec constantes status PHP.
