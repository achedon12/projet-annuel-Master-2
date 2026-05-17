# Where to put new code

- `src/Controller/Api/*Controller.php` — route attributes, JSON responses, JWT auth opt-in (see `auth.md`).
- `src/Entity/*.php` + `src/Repository/*Repository.php` — Doctrine. After entity edits run `php bin/console make:migration` and commit the generated migration alongside.
- `src/Service/*.php` — domain logic. Autowired by default per `config/services.yaml`.
- `src/EventListener/*.php` — implement `EventSubscriberInterface`; autoconfigure picks them up.
- `src/Command/*.php` — `#[AsCommand]` attribute; delegate heavy work to a service (see `ProcessPendingMailsCommand` which is a thin wrapper over `PendingMailProcessor`).
- `src/Message/*.php` + `src/MessageHandler/*.php` — Messenger; for async jobs.
- `src/Scheduler/*.php` — `#[AsSchedule('<name>')]`; remember to run `messenger:consume scheduler_<name>`.

Schema changes are always migration-driven (`make:migration` → `migrate`). The seed file is idempotent if you add one.
