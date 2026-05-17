# Commands

```bash
composer install
symfony server:start                                 # http://localhost:8000
php bin/console doctrine:migrations:migrate
php bin/console make:migration                       # diff-based, after entity edits
php bin/console messenger:consume async              # generic Messenger transport
php bin/console messenger:consume scheduler_mail     # Scheduler worker — ticks MailSchedule every minute
php bin/console app:mail:process --batch-size=50     # manual one-shot of the mail batch
```

All controllers live under `App\Controller\Api\*` and are mounted at `/api/*` via route attributes. There is no Symfony security firewall — auth is opt-in per controller (see `auth.md`).

No test runner is configured.
